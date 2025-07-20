import { db } from "../db";
import { 
  purchaseRegister, 
  invoices, 
  purchaseRegisterReconciliation, 
  documents,
  type PurchaseRegister,
  type Invoice,
  type InsertPurchaseRegister,
  type InsertInvoice,
  type PurchaseRegisterReconciliation
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { anthropicService } from "./anthropicService";

export interface InvoiceProcessingResult {
  success: boolean;
  invoiceId?: string;
  purchaseRegisterEntryId?: string;
  isDuplicate?: boolean;
  error?: string;
}

export interface PurchaseRegisterReconciliationResult {
  reconciliationId: string;
  manualEntriesCount: number;
  generatedEntriesCount: number;
  duplicatesFound: number;
  totalEntries: number;
  unmatchedEntries: number;
  reconciliationSummary: {
    duplicates: Array<{
      id: string;
      invoiceNumber: string;
      vendorName: string;
      amount: number;
      duplicateReason: string;
    }>;
    unmatched: Array<{
      id: string;
      invoiceNumber: string;
      vendorName: string;
      amount: number;
      sourceType: string;
    }>;
    statistics: {
      totalValue: number;
      manualValue: number;
      generatedValue: number;
      duplicateValue: number;
    };
  };
}

export class PurchaseRegisterService {
  
  /**
   * Get all purchase register entries for a tenant
   */
  async getPurchaseRegisterEntries(tenantId: string): Promise<PurchaseRegister[]> {
    const entries = await db
      .select()
      .from(purchaseRegister)
      .where(eq(purchaseRegister.tenantId, tenantId))
      .orderBy(desc(purchaseRegister.invoiceDate));
    
    return entries;
  }

  /**
   * Get all invoices for a tenant
   */
  async getInvoices(tenantId: string): Promise<Invoice[]> {
    const invoiceList = await db
      .select()
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId))
      .orderBy(desc(invoices.invoiceDate));
    
    return invoiceList;
  }

  /**
   * Process individual invoice and extract data for purchase register
   */
  async processInvoice(documentId: string, tenantId: string): Promise<InvoiceProcessingResult> {
    try {
      // Get document details
      const [document] = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenantId, tenantId)
        ));

      if (!document) {
        return { success: false, error: "Document not found" };
      }

      // Extract invoice data using AI
      const extractedData = await this.extractInvoiceData(document);
      
      if (!extractedData.success) {
        return { success: false, error: extractedData.error };
      }

      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(
        extractedData.data.invoiceNumber,
        extractedData.data.vendorName,
        extractedData.data.totalAmount,
        tenantId
      );

      // Create invoice record
      const [invoiceRecord] = await db
        .insert(invoices)
        .values({
          tenantId,
          documentId,
          invoiceNumber: extractedData.data.invoiceNumber,
          invoiceDate: new Date(extractedData.data.invoiceDate),
          vendorName: extractedData.data.vendorName,
          vendorGstin: extractedData.data.vendorGstin,
          vendorAddress: extractedData.data.vendorAddress,
          totalAmount: extractedData.data.totalAmount.toString(),
          taxAmount: extractedData.data.taxAmount?.toString(),
          lineItems: extractedData.data.lineItems,
          extractedData: extractedData.data,
          processingStatus: duplicateCheck.isDuplicate ? "pending" : "processed",
          addedToPurchaseRegister: false,
        })
        .returning();

      // If not duplicate, add to purchase register
      let purchaseRegisterEntryId: string | undefined;
      
      if (!duplicateCheck.isDuplicate) {
        purchaseRegisterEntryId = await this.addToPurchaseRegister(
          invoiceRecord,
          extractedData.data,
          tenantId
        );
        
        // Update invoice record
        await db
          .update(invoices)
          .set({
            addedToPurchaseRegister: true,
            purchaseRegisterEntryId,
          })
          .where(eq(invoices.id, invoiceRecord.id));
      }

      return {
        success: true,
        invoiceId: invoiceRecord.id,
        purchaseRegisterEntryId,
        isDuplicate: duplicateCheck.isDuplicate,
      };
      
    } catch (error) {
      console.error("Error processing invoice:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process manually uploaded purchase register
   */
  async processManualPurchaseRegister(documentId: string, tenantId: string): Promise<{ success: boolean; entriesCount?: number; error?: string }> {
    try {
      // Get document details
      const [document] = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          eq(documents.tenantId, tenantId)
        ));

      if (!document) {
        return { success: false, error: "Document not found" };
      }

      // Extract purchase register data
      const extractedEntries = await this.extractPurchaseRegisterData(document);
      
      if (!extractedEntries.success) {
        return { success: false, error: extractedEntries.error };
      }

      let entriesCount = 0;
      
      // Process each entry
      for (const entry of extractedEntries.data) {
        // Check for duplicates
        const duplicateCheck = await this.checkForDuplicates(
          entry.invoiceNumber,
          entry.vendorName,
          parseFloat(entry.totalAmount),
          tenantId
        );

        // Insert entry
        await db
          .insert(purchaseRegister)
          .values({
            tenantId,
            invoiceNumber: entry.invoiceNumber,
            invoiceDate: new Date(entry.invoiceDate),
            vendorName: entry.vendorName,
            vendorGstin: entry.vendorGstin,
            itemDescription: entry.itemDescription,
            hsnCode: entry.hsnCode,
            quantity: entry.quantity?.toString(),
            rate: entry.rate?.toString(),
            taxableAmount: entry.taxableAmount.toString(),
            cgstRate: entry.cgstRate?.toString(),
            cgstAmount: entry.cgstAmount?.toString(),
            sgstRate: entry.sgstRate?.toString(),
            sgstAmount: entry.sgstAmount?.toString(),
            igstRate: entry.igstRate?.toString(),
            igstAmount: entry.igstAmount?.toString(),
            totalAmount: entry.totalAmount.toString(),
            sourceType: "manual_upload",
            sourceDocumentId: documentId,
            isDuplicate: duplicateCheck.isDuplicate,
            duplicateOfId: duplicateCheck.duplicateOfId,
            reconciliationStatus: "pending",
            isValidated: false,
          });
        
        entriesCount++;
      }

      return { success: true, entriesCount };
      
    } catch (error) {
      console.error("Error processing manual purchase register:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate purchase register from individual invoices
   */
  async generateFromInvoices(tenantId: string): Promise<{ success: boolean; entriesGenerated?: number; error?: string }> {
    try {
      // Get all processed invoices not yet added to purchase register
      const unprocessedInvoices = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.addedToPurchaseRegister, false),
          eq(invoices.processingStatus, "processed")
        ));

      let entriesGenerated = 0;

      for (const invoice of unprocessedInvoices) {
        // Generate purchase register entry from invoice
        const purchaseRegisterEntryId = await this.addToPurchaseRegister(
          invoice,
          invoice.extractedData as any,
          tenantId
        );

        // Update invoice
        await db
          .update(invoices)
          .set({
            addedToPurchaseRegister: true,
            purchaseRegisterEntryId,
          })
          .where(eq(invoices.id, invoice.id));

        entriesGenerated++;
      }

      return { success: true, entriesGenerated };
      
    } catch (error) {
      console.error("Error generating purchase register from invoices:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform reconciliation between manual and generated entries
   */
  async performReconciliation(tenantId: string): Promise<PurchaseRegisterReconciliationResult> {
    try {
      // Get all entries
      const allEntries = await db
        .select()
        .from(purchaseRegister)
        .where(eq(purchaseRegister.tenantId, tenantId));

      // Separate manual and generated entries
      const manualEntries = allEntries.filter(e => e.sourceType === "manual_upload");
      const generatedEntries = allEntries.filter(e => e.sourceType === "generated_from_invoices");

      // Find duplicates and unmatched entries
      const duplicates: any[] = [];
      const unmatched: any[] = [];

      // Mark duplicates
      for (const manualEntry of manualEntries) {
        const matchingGenerated = generatedEntries.find(genEntry => 
          genEntry.invoiceNumber === manualEntry.invoiceNumber &&
          genEntry.vendorName === manualEntry.vendorName &&
          Math.abs(parseFloat(genEntry.totalAmount) - parseFloat(manualEntry.totalAmount)) < 1
        );

        if (matchingGenerated) {
          duplicates.push({
            id: manualEntry.id,
            invoiceNumber: manualEntry.invoiceNumber,
            vendorName: manualEntry.vendorName,
            amount: parseFloat(manualEntry.totalAmount),
            duplicateReason: "Matching invoice number and vendor",
          });

          // Mark as duplicate
          await db
            .update(purchaseRegister)
            .set({
              isDuplicate: true,
              duplicateOfId: matchingGenerated.id,
              reconciliationStatus: "matched",
            })
            .where(eq(purchaseRegister.id, manualEntry.id));
        }
      }

      // Find unmatched entries
      for (const entry of allEntries) {
        if (!entry.isDuplicate) {
          const hasMatch = allEntries.some(otherEntry => 
            otherEntry.id !== entry.id &&
            otherEntry.invoiceNumber === entry.invoiceNumber &&
            otherEntry.vendorName === entry.vendorName
          );

          if (!hasMatch) {
            unmatched.push({
              id: entry.id,
              invoiceNumber: entry.invoiceNumber,
              vendorName: entry.vendorName,
              amount: parseFloat(entry.totalAmount),
              sourceType: entry.sourceType,
            });

            // Mark as unmatched
            await db
              .update(purchaseRegister)
              .set({ reconciliationStatus: "unmatched" })
              .where(eq(purchaseRegister.id, entry.id));
          }
        }
      }

      // Calculate statistics
      const totalValue = allEntries.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0);
      const manualValue = manualEntries.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0);
      const generatedValue = generatedEntries.reduce((sum, entry) => sum + parseFloat(entry.totalAmount), 0);
      const duplicateValue = duplicates.reduce((sum, dup) => sum + dup.amount, 0);

      const reconciliationSummary = {
        duplicates,
        unmatched,
        statistics: {
          totalValue,
          manualValue,
          generatedValue,
          duplicateValue,
        },
      };

      // Create reconciliation record
      const [reconciliation] = await db
        .insert(purchaseRegisterReconciliation)
        .values({
          tenantId,
          manualEntriesCount: manualEntries.length,
          generatedEntriesCount: generatedEntries.length,
          duplicatesFound: duplicates.length,
          totalEntries: allEntries.length,
          unmatchedEntries: unmatched.length,
          reconciliationSummary,
        })
        .returning();

      return {
        reconciliationId: reconciliation.id,
        manualEntriesCount: manualEntries.length,
        generatedEntriesCount: generatedEntries.length,
        duplicatesFound: duplicates.length,
        totalEntries: allEntries.length,
        unmatchedEntries: unmatched.length,
        reconciliationSummary,
      };
      
    } catch (error) {
      console.error("Error performing reconciliation:", error);
      throw error;
    }
  }

  /**
   * Get reconciliation history
   */
  async getReconciliationHistory(tenantId: string): Promise<PurchaseRegisterReconciliation[]> {
    const history = await db
      .select()
      .from(purchaseRegisterReconciliation)
      .where(eq(purchaseRegisterReconciliation.tenantId, tenantId))
      .orderBy(desc(purchaseRegisterReconciliation.reconciliationDate));
    
    return history;
  }

  /**
   * Extract invoice data using AI
   */
  private async extractInvoiceData(document: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Use AI to extract structured invoice data
      const extractionPrompt = `
        Extract the following information from this invoice document:
        - Invoice number
        - Invoice date
        - Vendor name
        - Vendor GSTIN
        - Vendor address
        - Line items (description, HSN code, quantity, rate, amount)
        - Tax details (CGST, SGST, IGST rates and amounts)
        - Total amount
        
        Return the data in JSON format with proper structure.
      `;

      const extractedData = await anthropicService.analyzeTransactionNarration(
        document.documentType,
        document.originalName,
        document.originalName,
        "0",
        extractionPrompt
      );

      // Parse the AI response and structure it
      const data = {
        invoiceNumber: this.extractField(extractedData, "invoice_number") || `INV-${Date.now()}`,
        invoiceDate: this.extractField(extractedData, "invoice_date") || new Date().toISOString(),
        vendorName: this.extractField(extractedData, "vendor_name") || "Unknown Vendor",
        vendorGstin: this.extractField(extractedData, "vendor_gstin"),
        vendorAddress: this.extractField(extractedData, "vendor_address"),
        totalAmount: parseFloat(this.extractField(extractedData, "total_amount") || "0"),
        taxAmount: parseFloat(this.extractField(extractedData, "tax_amount") || "0"),
        lineItems: this.extractField(extractedData, "line_items") || [],
      };

      return { success: true, data };
      
    } catch (error) {
      console.error("Error extracting invoice data:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract purchase register data from uploaded file
   */
  private async extractPurchaseRegisterData(document: any): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // For now, return sample data structure
      // In production, this would parse Excel/CSV files
      const sampleData = [
        {
          invoiceNumber: `PR-${Date.now()}-1`,
          invoiceDate: new Date().toISOString(),
          vendorName: "Sample Vendor 1",
          vendorGstin: "22AAAAA0000A1Z5",
          itemDescription: "Office Supplies",
          hsnCode: "9999",
          quantity: 10,
          rate: 100,
          taxableAmount: 1000,
          cgstRate: 9,
          cgstAmount: 90,
          sgstRate: 9,
          sgstAmount: 90,
          igstRate: 0,
          igstAmount: 0,
          totalAmount: 1180,
        },
      ];

      return { success: true, data: sampleData };
      
    } catch (error) {
      console.error("Error extracting purchase register data:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for duplicate entries
   */
  private async checkForDuplicates(
    invoiceNumber: string,
    vendorName: string,
    totalAmount: number,
    tenantId: string
  ): Promise<{ isDuplicate: boolean; duplicateOfId?: string }> {
    const existing = await db
      .select()
      .from(purchaseRegister)
      .where(and(
        eq(purchaseRegister.tenantId, tenantId),
        eq(purchaseRegister.invoiceNumber, invoiceNumber),
        eq(purchaseRegister.vendorName, vendorName)
      ));

    if (existing.length > 0) {
      // Check if amount is also similar (within 1 rupee difference)
      const duplicate = existing.find(entry => 
        Math.abs(parseFloat(entry.totalAmount) - totalAmount) < 1
      );
      
      if (duplicate) {
        return { isDuplicate: true, duplicateOfId: duplicate.id };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Add invoice to purchase register
   */
  private async addToPurchaseRegister(
    invoice: Invoice,
    extractedData: any,
    tenantId: string
  ): Promise<string> {
    const [entry] = await db
      .insert(purchaseRegister)
      .values({
        tenantId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        vendorName: invoice.vendorName,
        vendorGstin: invoice.vendorGstin,
        itemDescription: extractedData.itemDescription || "Invoice item",
        hsnCode: extractedData.hsnCode,
        quantity: extractedData.quantity?.toString(),
        rate: extractedData.rate?.toString(),
        taxableAmount: (parseFloat(invoice.totalAmount) - (parseFloat(invoice.taxAmount || "0"))).toString(),
        cgstRate: extractedData.cgstRate?.toString(),
        cgstAmount: extractedData.cgstAmount?.toString(),
        sgstRate: extractedData.sgstRate?.toString(),
        sgstAmount: extractedData.sgstAmount?.toString(),
        igstRate: extractedData.igstRate?.toString(),
        igstAmount: extractedData.igstAmount?.toString(),
        totalAmount: invoice.totalAmount,
        sourceType: "generated_from_invoices",
        sourceDocumentId: invoice.documentId,
        reconciliationStatus: "pending",
        isValidated: false,
      })
      .returning();

    return entry.id;
  }

  /**
   * Extract field from AI response
   */
  private extractField(text: string, fieldName: string): string | null {
    try {
      // Simple pattern matching for extracted fields
      const patterns = {
        invoice_number: /invoice[_\s]number[:\s]*([^\n\r,]+)/i,
        invoice_date: /invoice[_\s]date[:\s]*([^\n\r,]+)/i,
        vendor_name: /vendor[_\s]name[:\s]*([^\n\r,]+)/i,
        vendor_gstin: /gstin[:\s]*([^\n\r,]+)/i,
        vendor_address: /address[:\s]*([^\n\r,]+)/i,
        total_amount: /total[_\s]amount[:\s]*([0-9,]+\.?[0-9]*)/i,
        tax_amount: /tax[_\s]amount[:\s]*([0-9,]+\.?[0-9]*)/i,
      };

      const pattern = patterns[fieldName as keyof typeof patterns];
      if (pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

export const purchaseRegisterService = new PurchaseRegisterService();
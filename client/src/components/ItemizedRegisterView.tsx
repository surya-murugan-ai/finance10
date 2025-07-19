import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";

interface ItemizedTransaction {
  id: number;
  company: string;
  particulars: string;
  transactionDate: string | null;
  voucherNumber: string;
  voucherType: string;
  debitAmount: string;
  creditAmount: string;
  netAmount: string;
  category: string;
  aiConfidence: number;
  originalRowData?: any;
}

interface ItemizedRegisterViewProps {
  transactions: ItemizedTransaction[];
  documentName: string;
}

interface InvoiceGroup {
  invoiceNumber: string;
  company: string;
  date: string;
  voucherType: string;
  items: ItemizedTransaction[];
  totalValue: number;
  grossTotal: number;
}

export function ItemizedRegisterView({ transactions, documentName }: ItemizedRegisterViewProps) {
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());

  // Group transactions by invoice number
  const invoiceGroups: InvoiceGroup[] = transactions.reduce((groups: InvoiceGroup[], transaction) => {
    const invoiceNumber = transaction.voucherNumber;
    let group = groups.find(g => g.invoiceNumber === invoiceNumber);
    
    if (!group) {
      group = {
        invoiceNumber,
        company: transaction.company,
        date: transaction.transactionDate || '2025-04-08',
        voucherType: transaction.voucherType,
        items: [],
        totalValue: 0,
        grossTotal: 0
      };
      groups.push(group);
    }
    
    group.items.push(transaction);
    group.totalValue += parseFloat(transaction.netAmount);
    group.grossTotal += parseFloat(transaction.netAmount);
    
    return groups;
  }, []);

  const toggleInvoice = (invoiceNumber: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceNumber)) {
      newExpanded.delete(invoiceNumber);
    } else {
      newExpanded.add(invoiceNumber);
    }
    setExpandedInvoices(newExpanded);
  };

  const extractItemDetails = (particulars: string) => {
    // Extract item details from particulars string
    const match = particulars.match(/(.+?)\s*\((.+?)\s*@\s*₹(.+?)\)\s*HSN:\s*(.+)/);
    if (match) {
      return {
        description: match[1].replace(/^INV-\d+-\d+:\s*/, ''),
        quantityUnit: match[2],
        rate: match[3],
        hsnCode: match[4]
      };
    }
    return {
      description: particulars,
      quantityUnit: '',
      rate: '',
      hsnCode: ''
    };
  };

  const maxItems = Math.max(...invoiceGroups.map(group => group.items.length));
  
  // Get all unique item names for headers
  const allItemNames = invoiceGroups.reduce((names: string[], group) => {
    group.items.forEach(item => {
      const itemDetails = extractItemDetails(item.particulars);
      if (!names.includes(itemDetails.description)) {
        names.push(itemDetails.description);
      }
    });
    return names;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Itemized Sales Register - {documentName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Particulars</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Voucher Type</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Voucher Number</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Narration</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Value</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Gross Total</th>
                {allItemNames.slice(0, maxItems).map((itemName, i) => (
                  <th key={i} className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-48">
                    {itemName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoiceGroups.map((group) => (
                <tr key={group.invoiceNumber} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2">{group.date}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleInvoice(group.invoiceNumber)}
                      className="flex items-center gap-1 p-0 h-auto font-normal"
                    >
                      {expandedInvoices.has(group.invoiceNumber) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {group.company} - Invoice {group.invoiceNumber}
                    </Button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{group.voucherType}</td>
                  <td className="border border-gray-300 px-3 py-2">{group.invoiceNumber}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    Itemized invoice with {group.items.length} line items
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                    ₹{group.totalValue.toLocaleString('en-IN')}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                    ₹{group.grossTotal.toLocaleString('en-IN')}
                  </td>
                  {allItemNames.slice(0, maxItems).map((itemName, colIndex) => {
                    // Find the item in this group that matches this column's item name
                    const matchingItem = group.items.find(item => {
                      const itemDetails = extractItemDetails(item.particulars);
                      return itemDetails.description === itemName;
                    });
                    
                    if (matchingItem) {
                      const itemDetails = extractItemDetails(matchingItem.particulars);
                      return (
                        <td key={colIndex} className="border border-gray-300 px-3 py-2">
                          <div className="text-sm space-y-1">
                            <div className="text-gray-600">{itemDetails.quantityUnit}</div>
                            <div className="text-gray-800">Rate: ₹{itemDetails.rate}</div>
                            <div className="text-green-700 font-medium">₹{parseFloat(matchingItem.netAmount).toLocaleString('en-IN')}</div>
                            {itemDetails.hsnCode && (
                              <div className="text-xs text-gray-500">HSN: {itemDetails.hsnCode}</div>
                            )}
                          </div>
                        </td>
                      );
                    } else {
                      return (
                        <td key={colIndex} className="border border-gray-300 px-3 py-2"></td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expanded Details */}
        {Array.from(expandedInvoices).map(invoiceNumber => {
          const group = invoiceGroups.find(g => g.invoiceNumber === invoiceNumber);
          if (!group) return null;

          return (
            <div key={`expanded-${invoiceNumber}`} className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">
                Invoice {invoiceNumber} - Line Item Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item, index) => {
                  const itemDetails = extractItemDetails(item.particulars);
                  return (
                    <div key={item.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-blue-600">Item {index + 1}</span>
                        <span className="text-sm font-bold text-green-600">
                          ₹{parseFloat(item.netAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{itemDetails.description}</div>
                        <div className="text-gray-600">{itemDetails.quantityUnit}</div>
                        <div>Rate: ₹{itemDetails.rate}</div>
                        {itemDetails.hsnCode && (
                          <div className="text-xs text-gray-500">HSN: {itemDetails.hsnCode}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between items-center text-sm">
            <span>Total Invoices: {invoiceGroups.length}</span>
            <span>Total Line Items: {transactions.length}</span>
            <span className="font-bold">
              Grand Total: ₹{invoiceGroups.reduce((sum, group) => sum + group.totalValue, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
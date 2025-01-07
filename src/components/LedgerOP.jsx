import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  Share2,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import autoTable from "jspdf-autotable";

const Ledger = () => {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem("ledgerEntries");
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    particular: "",
    category: "",
    companyName: "",
    credit: "",
    debit: "",
    balance: 0,
  });

  const categories = [
    "Sales",
    "Purchase",
    "Salary",
    "Rent",
    "Utilities",
    "Marketing",
    "Others",
  ];

  useEffect(() => {
    localStorage.setItem("ledgerEntries", JSON.stringify(entries));
  }, [entries]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const calculateBalance = (entry, prevBalance) => {
    const credit = parseFloat(entry.credit) || 0;
    const debit = parseFloat(entry.debit) || 0;
    return prevBalance + credit - debit;
  };

  const handleAddEntry = () => {
    if (!newEntry.category || !newEntry.companyName) {
      alert("Please fill all the fields");
      return;
    }

    const prevBalance =
      entries.length > 0 ? entries[entries.length - 1].balance : 0;

    const newBalance = calculateBalance(newEntry, prevBalance);

    setEntries([
      ...entries,
      {
        ...newEntry,
        balance: newBalance,
        id: Date.now(),
      },
    ]);

    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      particular: "",
      category: "",
      companyName: "",
      credit: "",
      debit: "",
      balance: newBalance,
    });
  };

const exportToPDF = () => {
  const doc = new jsPDF();

  if (filteredEntries.length === 0) {
    alert("No entries to export.");
    return;
  }

  // Use the first company name in the filtered entries
  const companyName =
    filteredEntries.length > 0 ? filteredEntries[0].companyName : "Unknown";

  // Add Main Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#333333");
  doc.text("Company Ledger Report", 14, 20);

  // Add Company Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "italic");
  doc.setTextColor("#4CAF50");
  doc.text(`Company: ${companyName}`, 14, 30);

  // Add Generated Date
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#666666");
  doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy")}`, 14, 40);

  // Add Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 45, doc.internal.pageSize.width - 14, 45);

  // Prepare Data for Table
  const tableData = filteredEntries.map((entry) => [
    format(new Date(entry.date), "MM/dd/yyyy"),
    entry.companyName,
    entry.particular,
    entry.category,
    entry.credit ? `₹${parseFloat(entry.credit).toFixed(2)}` : "-",
    entry.debit ? `₹${parseFloat(entry.debit).toFixed(2)}` : "-",
    `₹${entry.balance.toFixed(2)}`,
  ]);

  // Add Summary Row
  const totalCredit = filteredEntries.reduce(
    (sum, entry) => sum + (parseFloat(entry.credit) || 0),
    0
  );
  const totalDebit = filteredEntries.reduce(
    (sum, entry) => sum + (parseFloat(entry.debit) || 0),
    0
  );
  const currentBalance =
    filteredEntries.length > 0
      ? filteredEntries[filteredEntries.length - 1].balance
      : 0;

  const summaryRow = [
    "",
    "Summary",
    "",
    "",
    `₹${totalCredit.toFixed(2)}`,
    `₹${totalDebit.toFixed(2)}`,
    `₹${currentBalance.toFixed(2)}`,
  ];

  // Generate Table with Pagination
  autoTable(doc, {
    head: [
      [
        "Date",
        "Company Name",
        "Particular",
        "Category",
        "Credit",
        "Debit",
        "Balance",
      ],
    ],
    body: [...tableData, summaryRow],
    startY: 50,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      halign: "center",
      valign: "middle",
    },
    headStyles: {
      fillColor: "#4CAF50",
      textColor: "#FFFFFF",
      fontStyle: "bold",
    },
    bodyStyles: { fillColor: "#F9F9F9", textColor: "#333333" },
    alternateRowStyles: { fillColor: "#F1F1F1" },
    columnStyles: {
      0: { cellWidth: "auto" }, // Date
      1: { cellWidth: "auto" }, // Company Name
      2: { cellWidth: 50 }, // Particular
      3: { cellWidth: "auto" }, // Category
      4: { cellWidth: 20, halign: "right" }, // Credit
      5: { cellWidth: 20, halign: "right" }, // Debit
      6: { cellWidth: 25, halign: "right" }, // Balance
    },
    didDrawPage: (data) => {
      // Add Page Number
      const pageCount = doc.internal.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setTextColor("#666666");
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 14, pageHeight - 10);
    },
  });

  // Add Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor("#666666");
  doc.text("Generated via Company Ledger App", 14, pageHeight - 5);

  // Save the PDF
  doc.save(`${companyName.replace(/\s+/g, "_")}_ledger-report.pdf`);
};





  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEntries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "ledger.xlsx");
  };

  const shareViaWhatsApp = () => {
    const totalCredit = entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.credit) || 0),
      0
    );
    const totalDebit = entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.debit) || 0),
      0
    );
    const currentBalance =
      entries.length > 0 ? entries[entries.length - 1].balance : 0;

    const message = `
🏢 Company Ledger Summary
📅 ${format(new Date(), "MMMM dd, yyyy")}

💰 Total Credit: ₹${totalCredit.toFixed(2)}
💸 Total Debit: ₹${totalDebit.toFixed(2)}
📊 Current Balance: ₹${currentBalance.toFixed(2)}

Generated via Company Ledger App
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleUpdateEntry = (id) => {
    const entryToUpdate = entries.find((entry) => entry.id === id);
    setNewEntry(entryToUpdate);
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleDeleteEntry = (id) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.particular.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Company Ledger</h1>
            <p className="text-gray-600">
              {format(new Date(), "MMMM dd, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <IconButton
              onClick={exportToExcel}
              className="bg-green-50 hover:bg-green-100"
              title="Export to Excel"
            >
              <FileSpreadsheet className="text-green-600" />
            </IconButton>
            <IconButton
              onClick={exportToPDF}
              className="bg-red-50 hover:bg-red-100"
              title="Export to PDF"
            >
              <FileText className="text-red-600" />
            </IconButton>
            <IconButton
              onClick={shareViaWhatsApp}
              className="bg-green-50 hover:bg-green-100"
              title="Share via WhatsApp"
            >
              <Share2 className="text-green-600" />
            </IconButton>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <TextField
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Select
            label="Category Filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            variant="outlined"
            fullWidth
          >
            <MenuItem value="all">All</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* New Entry Form */}
        <Card className="mb-6 shadow-md">
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Company Name"
                variant="outlined"
                value={newEntry.companyName}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, companyName: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Particular"
                variant="outlined"
                value={newEntry.particular}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, particular: e.target.value })
                }
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Select
                label="Category"
                value={newEntry.category}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, category: e.target.value })
                }
                variant="outlined"
                fullWidth
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label="Credit"
                variant="outlined"
                type="number"
                value={newEntry.credit}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, credit: e.target.value })
                }
                fullWidth
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <TextField
                label="Debit"
                variant="outlined"
                type="number"
                value={newEntry.debit}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, debit: e.target.value })
                }
                fullWidth
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddEntry}
                startIcon={<Plus />}
              >
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Company Name</th>
                <th className="py-2 px-4 text-left">Particular</th>
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Credit</th>
                <th className="py-2 px-4 text-left">Debit</th>
                <th className="py-2 px-4 text-left">Balance</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="py-2 px-4">
                    {format(new Date(entry.date), "MM/dd/yyyy")}
                  </td>
                  <td className="py-2 px-4">{entry.companyName}</td>
                  <td className="py-2 px-4">{entry.particular}</td>
                  <td className="py-2 px-4">{entry.category}</td>
                  <td className="py-2 px-4">{entry.credit || "-"}</td>
                  <td className="py-2 px-4">{entry.debit || "-"}</td>
                  <td className="py-2 px-4">{entry.balance.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    <IconButton onClick={() => handleUpdateEntry(entry.id)}>
                      <Edit className="text-blue-600" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteEntry(entry.id)}>
                      <Trash2 className="text-red-600" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Ledger;     
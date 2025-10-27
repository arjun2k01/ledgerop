import { useState, useEffect, useMemo } from "react";
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

const categories = [
  "Sales",
  "Purchase",
  "Salary",
  "Rent",
  "Utilities",
  "Marketing",
  "Others",
];

const Ledger = () => {
  // ✅ Initialize ledger from localStorage safely
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem("ledgerEntries");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    particular: "",
    category: "",
    companyName: "",
    credit: "",
    debit: "",
  });

  // ✅ Save entries to localStorage
  useEffect(() => {
    localStorage.setItem("ledgerEntries", JSON.stringify(entries));
  }, [entries]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // ✅ Helper: Calculate balances dynamically
  const recalcBalances = (data) => {
    let runningBalance = 0;
    return data.map((entry) => {
      const credit = parseFloat(entry.credit) || 0;
      const debit = parseFloat(entry.debit) || 0;
      runningBalance += credit - debit;
      return { ...entry, balance: runningBalance };
    });
  };

  // ✅ Memoized filter for better performance
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.particular.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || entry.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchTerm, categoryFilter]);

  // ✅ Add or Update Entry
  const handleSaveEntry = () => {
    const { companyName, category, credit, debit } = newEntry;

    if (!companyName || !category) {
      alert("Please fill all fields before saving.");
      return;
    }

    if (credit && debit) {
      alert("Please fill either Credit OR Debit, not both.");
      return;
    }

    let updatedEntries;
    if (editingId) {
      updatedEntries = entries.map((entry) =>
        entry.id === editingId ? { ...newEntry, id: editingId } : entry
      );
      setEditingId(null);
    } else {
      updatedEntries = [
        ...entries,
        { ...newEntry, id: Date.now() },
      ];
    }

    setEntries(recalcBalances(updatedEntries));

    setNewEntry({
      date: format(new Date(), "yyyy-MM-dd"),
      particular: "",
      category: "",
      companyName: "",
      credit: "",
      debit: "",
    });
  };

  // ✅ Edit Entry
  const handleEditEntry = (id) => {
    const entry = entries.find((e) => e.id === id);
    setNewEntry(entry);
    setEditingId(id);
  };

  // ✅ Delete Entry with confirmation
  const handleDeleteEntry = (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const updated = entries.filter((entry) => entry.id !== id);
      setEntries(recalcBalances(updated));
    }
  };

  // ✅ Export to Excel
  const exportToExcel = () => {
    if (filteredEntries.length === 0) {
      alert("No entries to export.");
      return;
    }
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

  // ✅ Export to PDF
  const exportToPDF = () => {
    if (filteredEntries.length === 0) {
      alert("No entries to export.");
      return;
    }

    const doc = new jsPDF();
    const companyName =
      filteredEntries[0].companyName || "Unknown Company";

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Company Ledger Report", 14, 20);
    doc.setFontSize(14);
    doc.setTextColor("#4CAF50");
    doc.text(`Company: ${companyName}`, 14, 30);
    doc.setFontSize(12);
    doc.setTextColor("#666");
    doc.text(`Generated on: ${format(new Date(), "MMMM dd, yyyy")}`, 14, 40);

    autoTable(doc, {
      head: [["Date", "Company", "Particular", "Category", "Credit", "Debit", "Balance"]],
      body: filteredEntries.map((e) => [
        format(new Date(e.date), "MM/dd/yyyy"),
        e.companyName,
        e.particular,
        e.category,
        e.credit ? `₹${e.credit}` : "-",
        e.debit ? `₹${e.debit}` : "-",
        `₹${e.balance.toFixed(2)}`,
      ]),
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: "#4CAF50" },
    });

    doc.save(`${companyName.replace(/\s+/g, "_")}_Ledger.pdf`);
  };

  // ✅ Share via WhatsApp
  const shareViaWhatsApp = () => {
    if (entries.length === 0) return alert("No entries to share.");

    const totalCredit = entries.reduce(
      (sum, e) => sum + (parseFloat(e.credit) || 0),
      0
    );
    const totalDebit = entries.reduce(
      (sum, e) => sum + (parseFloat(e.debit) || 0),
      0
    );
    const balance = entries.length ? entries[entries.length - 1].balance : 0;

    const message = `
🏢 Company Ledger Summary
📅 ${format(new Date(), "MMMM dd, yyyy")}

💰 Total Credit: ₹${totalCredit.toFixed(2)}
💸 Total Debit: ₹${totalDebit.toFixed(2)}
📊 Current Balance: ₹${balance.toFixed(2)}

Generated via Company Ledger App
    `.trim();

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

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
            <p className="text-gray-600">{format(new Date(), "MMMM dd, yyyy")}</p>
          </div>
          <div className="flex gap-2">
            <IconButton onClick={exportToExcel} title="Export to Excel">
              <FileSpreadsheet className="text-green-600" />
            </IconButton>
            <IconButton onClick={exportToPDF} title="Export to PDF">
              <FileText className="text-red-600" />
            </IconButton>
            <IconButton onClick={shareViaWhatsApp} title="Share via WhatsApp">
              <Share2 className="text-green-600" />
            </IconButton>
          </div>
        </div>

        {/* Filters */}
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            fullWidth
          >
            <MenuItem value="all">All</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* Form */}
        <Card className="mb-6 shadow-md">
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Company Name"
                value={newEntry.companyName}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, companyName: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Particular"
                value={newEntry.particular}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, particular: e.target.value })
                }
                fullWidth
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Select
                value={newEntry.category}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, category: e.target.value })
                }
                fullWidth
                displayEmpty
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label="Credit"
                type="number"
                value={newEntry.credit}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, credit: e.target.value, debit: "" })
                }
                fullWidth
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <TextField
                label="Debit"
                type="number"
                value={newEntry.debit}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, debit: e.target.value, credit: "" })
                }
                fullWidth
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveEntry}
                startIcon={<Plus />}
              >
                {editingId ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                {["Date", "Company", "Particular", "Category", "Credit", "Debit", "Balance", "Actions"].map(
                  (h) => (
                    <th key={h} className="py-2 px-4 text-left">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, i) => (
                <tr key={entry.id} className={i % 2 === 0 ? "bg-gray-100" : "bg-white"}>
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
                    <IconButton onClick={() => handleEditEntry(entry.id)}>
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

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Pencil } from "lucide-react";
import BeneficiaryModal from "./BeneficiaryModal";
import type { Beneficiary } from "@/types/beneficiary";

export default function BeneficiariesTable() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);

  async function loadBeneficiaries() {
    setLoading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;

      const query = supabase
        .from("beneficiaries")
        .select("*")
        .order("name", { ascending: true });

      const { data, error } = uid ? await query.eq("owner_id", uid) : await query;
      
      if (error) throw error;
      setBeneficiaries(data as Beneficiary[]);
    } catch (error) {
      console.error("Error loading beneficiaries:", error);
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteBeneficiary(id: number) {
    if (!confirm("Are you sure you want to remove this beneficiary?")) return;
    
    try {
      const { error } = await supabase
        .from("beneficiaries")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      await loadBeneficiaries();
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      alert("Failed to delete beneficiary");
    }
  }

  useEffect(() => {
    loadBeneficiaries();

    const channel = supabase
      .channel("beneficiaries-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beneficiaries" },
        () => loadBeneficiaries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleEditBeneficiary(beneficiary: Beneficiary) {
    setSelectedBeneficiary(beneficiary);
    setModalOpen(true);
  }

  function handleAddNew() {
    setSelectedBeneficiary(null);
    setModalOpen(true);
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Beneficiaries</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Beneficiary
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-pulse text-gray-500">Loading beneficiaries...</div>
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No beneficiaries added yet.</p>
          <button
            onClick={handleAddNew}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            + Add your first beneficiary
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relationship
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {beneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {beneficiary.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {beneficiary.relationship}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {beneficiary.email || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {beneficiary.country || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditBeneficiary(beneficiary)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteBeneficiary(beneficiary.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BeneficiaryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadBeneficiaries}
        beneficiary={selectedBeneficiary}
      />
    </div>
  );
}


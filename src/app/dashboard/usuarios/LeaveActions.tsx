"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { approveLeaveRequest, rejectLeaveRequest } from "./actions";

export default function LeaveActions({ id }: { id: number }) {
  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => approveLeaveRequest(id)} 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"
        title="Aprobar"
      >
        <Check size={14} className="mr-1" /> Aprobar
      </Button>
      <Button 
        onClick={() => rejectLeaveRequest(id)} 
        size="sm" 
        className="bg-[#dc2626] hover:bg-red-700 text-white h-7 px-2"
        title="Rechazar"
      >
        <X size={14} className="mr-1" /> Rechazar
      </Button>
    </div>
  );
}

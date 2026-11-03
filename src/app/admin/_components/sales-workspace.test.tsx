import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assessmentDashboard, assessmentFixture } from "@/test/fixtures/assessment-admin";
import { pipelineInboxFixture } from '@/test/fixtures/pipeline-inbox';
vi.mock("./assessment-panel", () => ({ AssessmentPanel: (props: { expandedId: string; initialDetailTab: string }) => <p>Self Diagnostic {props.expandedId} · {props.initialDetailTab}</p> }));
vi.mock("./inquiries-panel", () => ({ InquiriesPanel: (props: { initialSelectedId: string }) => <p>Inquiry {props.initialSelectedId}</p> }));
vi.mock("./acquisition-control-panel", () => ({ AcquisitionControlPanel: (props: { initialView: string }) => <p>Kampanye {props.initialView}</p> }));
vi.mock("./pipeline-panel", () => ({ PipelinePanel: ({initialSelectedId,onUnsavedChange}:{initialSelectedId?:string;onUnsavedChange?:(dirty:boolean)=>void}) => <div><p>Peluang penjualan {initialSelectedId}</p><button type="button" onClick={()=>onUnsavedChange?.(true)}>Ubah peluang uji</button><button type="button" onClick={()=>onUnsavedChange?.(false)}>Selesai menyimpan peluang</button></div> }));
vi.mock("./meetings-panel", () => ({ MeetingsPanel: () => <p>Booking konsultasi</p> }));
vi.mock("./spin-panel", () => ({ SpinPanel: ({onUnsavedChange}:{onUnsavedChange?:(value:boolean)=>void}) => <div><p>Checklist aktif</p><button onClick={()=>onUnsavedChange?.(true)}>Ubah checklist</button><button onClick={()=>onUnsavedChange?.(false)}>Selesaikan simpan</button></div> }));
import { SalesWorkspace } from "./sales-workspace";
afterEach(cleanup);
describe("unified sales workspace", () => {
  it('opens the exact overdue opportunity and protects its unsaved changes from outer navigation',()=>{
    const confirm=vi.spyOn(window,'confirm').mockReturnValue(false),action=vi.fn();
    const data=assessmentDashboard([]);data.pipelineLeads=[pipelineInboxFixture({id:'selected-opportunity',nextActionDueAt:'2020-01-01T03:00:00Z'})];
    render(<SalesWorkspace data={data} onAction={action} onRefresh={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button',{name:'Buka peluang'}));expect(screen.getByText('Peluang penjualan selected-opportunity')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Ubah peluang uji'}));fireEvent.click(screen.getByRole('button',{name:'Inbound'}));
    expect(confirm).toHaveBeenCalled();expect(screen.queryByText('Kampanye inbound')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Selesai menyimpan peluang'}));fireEvent.click(screen.getByRole('button',{name:'Inbound'}));
    expect(screen.getByText('Kampanye inbound')).toBeVisible();expect(action).not.toHaveBeenCalled();confirm.mockRestore();
  });
  it("protects dirty or failed saves from all outer tabs and allows leaving after save", async () => {
    const confirm=vi.spyOn(window,"confirm").mockReturnValue(false);
    render(<SalesWorkspace data={assessmentDashboard([])} onAction={vi.fn()} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button",{name:"Klien & proposal"}));fireEvent.click(screen.getByRole("button",{name:"Discovery organisasi"}));
    fireEvent.click(await screen.findByRole("button",{name:"Ubah checklist"}));
    for(const label of ["Inbound","Inquiry masuk","Self Diagnostic & proposal","Mulai kampanye email","Konsultasi"]){
      fireEvent.click(screen.getByRole("button",{name:label}));expect(screen.getByText("Checklist aktif")).toBeInTheDocument();
    }
    expect(confirm).toHaveBeenCalledTimes(5);
    fireEvent.click(screen.getByRole("button",{name:"Selesaikan simpan"}));fireEvent.click(screen.getByRole("button",{name:"Inbound"}));
    expect(screen.queryByText("Checklist aktif")).not.toBeInTheDocument();expect(screen.getByText("Kampanye inbound")).toBeInTheDocument();confirm.mockRestore();
  });
  it("opens the selected client's proposal in place, without any send request", () => {
    const action = vi.fn();
    render(<SalesWorkspace data={assessmentDashboard([assessmentFixture()])} onAction={action} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Buka proposal" }));
    expect(screen.getByText("Self Diagnostic demo-assessment-1 · proposal")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });
  it("opens the correct inquiry and searches by its traffic source", () => {
    const data = assessmentDashboard([]);
    data.inquiries = [{ id: "inquiry-1", name: "Rina", email: "rina@example.com", source: "instagram", message: "Bisa konsultasi?", status: "Baru", notes: "", whatsapp: "", createdAt: "2026-10-06T03:00:00Z" }];
    const action = vi.fn();
    render(<SalesWorkspace data={data} onAction={action} onRefresh={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Cari prioritas penjualan" }), { target: { value: "instagram" } });
    fireEvent.click(screen.getByRole("button", { name: "Tulis balasan" }));
    expect(screen.getByText("Inquiry inquiry-1")).toBeInTheDocument(); expect(action).not.toHaveBeenCalled();
  });
  it("offers inbound and outbound from the same page with no mutation", () => {
    const action = vi.fn();
    render(<SalesWorkspace data={assessmentDashboard([])} onAction={action} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Mulai kampanye email" }));
    expect(screen.getByText("Kampanye outbound")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inbound" }));
    expect(screen.getByText("Kampanye inbound")).toBeInTheDocument(); expect(action).not.toHaveBeenCalled();
  });
});

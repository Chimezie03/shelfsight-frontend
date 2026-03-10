"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportsState } from "./hooks/use-reports-state";
import { ReportHeader } from "./components/report-header";
import { OverviewTab } from "./components/overview-tab";
import { CirculationTab } from "./components/circulation-tab";
import { CollectionTab } from "./components/collection-tab";
import { MembersTab } from "./components/members-tab";
import { FinancialTab } from "./components/financial-tab";
import { TAB_CONFIG } from "./constants";

export default function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    dateRange,
    handlePresetChange,
    handleCustomRangeChange,
    data,
    isLoading,
    handleExportCsv,
    handlePrint,
  } = useReportsState();

  return (
    <div className="p-8 print:p-4">
      <ReportHeader
        dateRange={dateRange}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
        onExportCsv={() => handleExportCsv(activeTab)}
        onPrint={handlePrint}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="print:hidden">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data.overview} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="circulation">
          <CirculationTab data={data.circulation} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="collection">
          <CollectionTab data={data.collection} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab data={data.members} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialTab data={data.financial} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

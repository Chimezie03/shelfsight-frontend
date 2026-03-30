"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useReportsState } from "./hooks/use-reports-state";
import { ReportHeader } from "./components/report-header";
import { OverviewTab } from "./components/overview-tab";
import { CirculationTab } from "./components/circulation-tab";
import { CollectionTab } from "./components/collection-tab";
import { MembersTab } from "./components/members-tab";
import { FinancialTab } from "./components/financial-tab";
import { TAB_CONFIG } from "./constants";

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = user?.role === "ADMIN";

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/dashboard");
    }
  }, [user, canAccess, router]);

  const {
    activeTab,
    setActiveTab,
    dateRange,
    handlePresetChange,
    handleCustomRangeChange,
    data,
    isLoading,
    error,
    handleExportCsv,
    handlePrint,
    retry,
  } = useReportsState();

  if (user && !canAccess) {
    return null;
  }

  if (!data && isLoading) {
    return (
      <div className="p-8 print:p-4">
        <ReportHeader
          dateRange={dateRange}
          onPresetChange={handlePresetChange}
          onCustomRangeChange={handleCustomRangeChange}
          onExportCsv={() => {}}
          onPrint={handlePrint}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 print:p-4">
        <ReportHeader
          dateRange={dateRange}
          onPresetChange={handlePresetChange}
          onCustomRangeChange={handleCustomRangeChange}
          onExportCsv={() => {}}
          onPrint={handlePrint}
        />
        <Alert variant="destructive">
          <AlertTitle>Unable to load reports</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error ?? "Please check your API connection and permissions."}</span>
            <Button variant="outline" size="sm" onClick={retry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Report data may be stale</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={retry}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
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

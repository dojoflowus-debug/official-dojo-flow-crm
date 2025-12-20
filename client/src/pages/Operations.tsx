import { useState } from "react";
import { Button } from "@/components/ui/button";
import BottomNavLayout from "@/components/BottomNavLayout";
import MerchandiseFulfillmentContent from "./MerchandiseFulfillmentContent";
import MerchandiseManagementContent from "./MerchandiseManagementContent";

export default function Operations() {
  const [activeView, setActiveView] = useState<"fulfillment" | "manage">("fulfillment");

  return (
    <BottomNavLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
            <p className="text-muted-foreground mt-1">
              Manage merchandise fulfillment and inventory
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-2">
              <Button
                variant={activeView === "fulfillment" ? "default" : "ghost"}
                onClick={() => setActiveView("fulfillment")}
                className="rounded-b-none"
              >
                Fulfillment
              </Button>
              <Button
                variant={activeView === "manage" ? "default" : "ghost"}
                onClick={() => setActiveView("manage")}
                className="rounded-b-none"
              >
                Manage Items
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6">
          {activeView === "fulfillment" && <MerchandiseFulfillmentContent />}
          {activeView === "manage" && <MerchandiseManagementContent />}
        </div>
      </div>
    </BottomNavLayout>
  );
}

import { Button } from "@/shared/components/ui/button";
import { AppLayout } from "@/shared/components/layout";
import { ShoppingCart, Download, Eye } from "lucide-react";

export default function Purchases() {
  const purchases = [
    {
      id: 1,
      courseName: "English A1 Beginner",
      instructor: "Sarah Johnson",
      purchaseDate: "2024-01-15",
      amount: "$29.99",
      status: "Active",
    },
    {
      id: 2,
      courseName: "Listening Skills Intensive",
      instructor: "Michael Davis",
      purchaseDate: "2024-01-10",
      amount: "$39.99",
      status: "Active",
    },
    {
      id: 3,
      courseName: "Business English Pro",
      instructor: "Emma Wilson",
      purchaseDate: "2023-12-20",
      amount: "$49.99",
      status: "Active",
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Purchases</h1>
            <p className="text-lg text-muted-foreground">
              View all your course purchases and subscriptions
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-xl border bg-background">
              <p className="text-sm text-muted-foreground mb-2">
                Active Courses
              </p>
              <p className="text-3xl font-bold">3</p>
            </div>
            <div className="p-6 rounded-xl border bg-background">
              <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
              <p className="text-3xl font-bold">$119.97</p>
            </div>
            <div className="p-6 rounded-xl border bg-background">
              <p className="text-sm text-muted-foreground mb-2">
                Lifetime Access
              </p>
              <p className="text-3xl font-bold text-green-600">Yes</p>
            </div>
          </div>

          {/* Purchases List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Recent Purchases</h2>
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="p-6 rounded-xl border bg-background hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="text-primary" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {purchase.courseName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {purchase.instructor}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Purchased</p>
                      <p className="font-semibold">{purchase.purchaseDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">{purchase.amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-semibold">
                        {purchase.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm">
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Section */}
          <div className="mt-12 p-6 rounded-xl border bg-background">
            <h2 className="text-xl font-bold mb-4">Billing Method</h2>
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Visa Card</p>
                  <p className="font-semibold">**** **** **** 4242</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
            <Button>Add Payment Method</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "../../../components/dashboard-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from "@whalli/ui";
import { ExternalLink } from "lucide-react";

interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  user?: {
    email: string;
    name: string | null;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/billing/subscriptions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "canceled":
      case "cancelled":
        return "destructive";
      case "past_due":
        return "warning";
      case "trialing":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan?.toUpperCase()) {
      case "ENTERPRISE":
        return "default";
      case "PRO":
        return "secondary";
      case "BASIC":
        return "outline";
      default:
        return "outline";
    }
  };

  const openStripeSubscription = (stripeSubId: string) => {
    const isDev = process.env.NODE_ENV === "development";
    const baseUrl = isDev
      ? "https://dashboard.stripe.com/test"
      : "https://dashboard.stripe.com";
    window.open(`${baseUrl}/subscriptions/${stripeSubId}`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subscriptions</h1>
            <p className="text-muted-foreground">
              View and manage user subscriptions
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              window.open("https://dashboard.stripe.com", "_blank")
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Stripe Dashboard
          </Button>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period Start</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Auto-Renew</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading subscriptions...
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {sub.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sub.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(sub.plan)}>
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(sub.status)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(sub.currentPeriodStart).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.cancelAtPeriodEnd ? "destructive" : "success"}
                      >
                        {sub.cancelAtPeriodEnd ? "No" : "Yes"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openStripeSubscription(sub.stripeSubscriptionId)
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View in Stripe
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}

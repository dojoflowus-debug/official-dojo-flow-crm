import { useState } from "react";
import { Key, Plus, Copy, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, AlertTriangle, Zap, Globe, Code2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppShell } from "@/components/AppShell";

function maskKey(key: string) {
  if (!key) return "";
  return key.slice(0, 10) + "••••••••••••••••••••" + key.slice(-4);
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  });
}

export default function ApiKeysSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ id: string; label: string; key: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; label: string } | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isRotating, setIsRotating] = useState(false);

  const { data, isLoading, refetch } = trpc.settings.listApiKeys.useQuery();
  const createMutation = trpc.settings.createApiKey.useMutation({
    onSuccess: (result) => {
      setNewlyCreatedKey(result);
      setNewKeyLabel("");
      setShowCreateModal(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const revokeMutation = trpc.settings.revokeApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key revoked");
      setRevokeTarget(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const regenerateMutation = trpc.settings.regenerateWidgetKey.useMutation({
    onSuccess: () => {
      toast.success("Primary API key regenerated");
      setIsRotating(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
      setIsRotating(false);
    },
  });

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!newKeyLabel.trim()) return;
    createMutation.mutate({ label: newKeyLabel.trim() });
  };

  const handleRotatePrimary = () => {
    setIsRotating(true);
    regenerateMutation.mutate();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-red-500" />
              API Keys
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage API keys for your organization. Use these keys to authenticate webhook calls from GoHighLevel, Zapier, or any custom integration.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New API Key
          </Button>
        </div>

        {/* How to use */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4">
          <div className="flex items-start gap-3">
            <Code2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-semibold">How to use API keys</p>
              <p>Include your API key in the <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">x-api-key</code> header of every request to the DojoFlow webhook endpoint:</p>
              <code className="block bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded mt-1 text-xs font-mono break-all">
                POST https://dojo-flow.ai/api/trpc/webhook.inbound<br />
                x-api-key: djf_your_key_here
              </code>
            </div>
          </div>
        </div>

        {/* Primary Key */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">Primary Key</span>
              <Badge variant="secondary" className="text-xs">Default</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotatePrimary}
              disabled={isRotating}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
              Rotate
            </Button>
          </div>
          <div className="px-5 py-4">
            {isLoading ? (
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
                  {visibleKeys.has("primary") ? data?.primaryKey ?? "—" : maskKey(data?.primaryKey ?? "")}
                </code>
                <button
                  onClick={() => toggleKeyVisibility("primary")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  title={visibleKeys.has("primary") ? "Hide" : "Show"}
                >
                  {visibleKeys.has("primary") ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(data?.primaryKey ?? "", "Primary API key")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Used by the Integrations Hub widget and lead capture embed. Rotating this key will break existing integrations until updated.</p>
          </div>
        </div>

        {/* Named Keys */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">Integration Keys</span>
              <Badge variant="outline" className="text-xs">{data?.namedKeys?.length ?? 0} / 10</Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="px-5 py-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.namedKeys?.length ? (
            <div className="px-5 py-10 text-center">
              <Key className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No integration keys yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create a key for each tool you connect (GoHighLevel, Zapier, etc.)</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create First Key
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.namedKeys.map((k) => (
                <div key={k.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{k.label}</span>
                      <span className="text-xs text-gray-400">Created {formatDate(k.createdAt)}</span>
                    </div>
                    <code className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">
                      {visibleKeys.has(k.id) ? k.key : maskKey(k.key)}
                    </code>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleKeyVisibility(k.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      title={visibleKeys.has(k.id) ? "Hide" : "Show"}
                    >
                      {visibleKeys.has(k.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(k.key, `"${k.label}" API key`)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Copy key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRevokeTarget({ id: k.id, label: k.label })}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Keep your API keys secret.</strong> Never expose them in client-side code or public repositories. If a key is compromised, revoke it immediately and create a new one.
          </p>
        </div>
      </div>

      {/* Create Key Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Give this key a descriptive label so you can identify which integration it belongs to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="e.g. GoHighLevel, Zapier, Custom CRM"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              maxLength={64}
            />
            <p className="text-xs text-gray-400">{newKeyLabel.length}/64 characters</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!newKeyLabel.trim() || createMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createMutation.isPending ? "Creating…" : "Create Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Newly Created Key — show once */}
      <Dialog open={!!newlyCreatedKey} onOpenChange={() => setNewlyCreatedKey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy this key now — it will not be shown again in full.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-gray-50 dark:bg-gray-800 px-3 py-3 rounded-lg break-all text-gray-800 dark:text-gray-200">
                {newlyCreatedKey?.key}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newlyCreatedKey?.key ?? "", `"${newlyCreatedKey?.label}" API key`)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              Store this key securely. After closing this dialog, only the masked version will be visible.
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewlyCreatedKey(null)} className="bg-red-600 hover:bg-red-700 text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke "{revokeTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This API key will be permanently deleted. Any integration using it will stop working immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeTarget && revokeMutation.mutate({ id: revokeTarget.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

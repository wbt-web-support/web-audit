'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuditSession, AuditSessionStatus } from '@/lib/types/database';
import { 
  Loader2, 
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  Globe,
  Plus,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface SessionFormProps {
  session?: AuditSession | null;
  mode: 'create' | 'edit';
  onSubmit?: (session: AuditSession) => void;
  sessions: AuditSession[];
}

export function SessionForm({ session, mode, onSubmit, sessions }: SessionFormProps) {
  const [loading, setLoading] = useState(false);
  const [sessionUrl, setSessionUrl] = useState(session?.base_url || '');
  const [companyName, setCompanyName] = useState(session?.company_name || '');
  const [phoneNumber, setPhoneNumber] = useState(session?.phone_number || '');
  const [email, setEmail] = useState(session?.email || '');
  const [address, setAddress] = useState(session?.address || '');
  const [customInfo, setCustomInfo] = useState(session?.custom_info || '');
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const router = useRouter();
  const normalizeUrl = (url: string) => url.replace(/\/+$/, "").toLowerCase();

  useEffect(() => {

    if (session) {
      setSessionUrl(session.base_url || '');
      setCompanyName(session.company_name || '');
      setPhoneNumber(session.phone_number || '');
      setEmail(session.email || '');
      setAddress(session.address || '');
      setCustomInfo(session.custom_info || '');
      // Optionally: setInstructions(session.instructions || [{ id: Date.now(), text: '' }]);
    }
  }, [session]);

  const handleInstructionChange = (idx: number, value: string) => {
    setInstructions((prev) =>
      prev.map((inst, i) => (i === idx ? value : inst))
    );
  };

  const handleAddInstruction = () => {
    setInstructions((prev) => [
      ...prev,
      '',
    ]);
  };

  const handleRemoveInstruction = (idx: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUrl.trim()) return;

    setLoading(true);
    setError('');
    const found = sessions.some(
      (session) => normalizeUrl(session.base_url) === normalizeUrl(sessionUrl)
    );
    if (found) {
      toast.info("A URL is already present in the sessions.");
      setLoading(false);
      return;
    } 

    try {
      const payload = {
        base_url: sessionUrl.trim(),
        company_name: companyName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        custom_info: customInfo.trim() || null,
        instructions: instructions.filter(Boolean),
      };

      const url = mode === 'create' 
        ? '/api/audit-sessions'
        : `/api/audit-sessions/${session?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (onSubmit && data.session) {
          onSubmit(data.session);
        } else {
          // Navigate to sessions page or audit page
          if (mode === 'create') {
            router.push(`/audit?session=${data.session.id}`);
          toast.success("Session created successfully!");
          } else {
            router.push('/sessions');
          }
        }
      } else {
        setError(data.error || `Failed to ${mode} session`);
      }
    } catch (error) {
      setError(`Failed to ${mode} session`);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'create' ? 'Create New Project' : 'Edit Project';
  const description = mode === 'create' 
    ? 'Enter website URL and expected company information for comprehensive audit'
    : 'Update website URL and expected company information';

  // Check if session is running and prevent editing
  const isSessionRunning = Boolean(session && (session.status === 'crawling' || session.status === 'analyzing'));

  return (
    <div className=" ">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSessionRunning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700">
                <span>This session is currently {session?.status}. You cannot edit it while it's running.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL *
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={sessionUrl}
                onChange={(e) => setSessionUrl(e.target.value)}
                disabled={loading || isSessionRunning}
                required
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={loading || isSessionRunning}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading || isSessionRunning}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isSessionRunning}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St, City, State 12345"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading || isSessionRunning}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customInfo" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Information
              </Label>
              <Input
                id="customInfo"
                type="text"
                placeholder="Any other information to verify (hours, services, etc.)"
                value={customInfo}
                onChange={(e) => setCustomInfo(e.target.value)}
                disabled={loading || isSessionRunning}
                className="mt-1"
              />
            </div>

            {/* Instructions textarea list */}
            {/* <div>
              <Label className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                Instructions
              </Label>
              <div className="space-y-3">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <textarea
                      value={inst}
                      onChange={(e) => handleInstructionChange(idx, e.target.value)}
                      placeholder={`Instruction ${idx + 1}`}
                      className="flex-1 h-16 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      rows={2}
                      disabled={loading || isSessionRunning}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handleAddInstruction}
                      aria-label="Add instruction"
                      disabled={loading || isSessionRunning}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {instructions.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => handleRemoveInstruction(idx)}
                        aria-label="Remove instruction"
                        disabled={loading || isSessionRunning}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div> */}
            
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={loading || !sessionUrl.trim() || isSessionRunning}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'Create Project' : 'Save Changes'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/sessions')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User,
  Loader2,
  Trash2
} from 'lucide-react';
import { SupportTicket, TicketResponse, TicketWithResponses } from '@/lib/types/database';

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const statusIcons = {
  open: <AlertCircle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  resolved: <CheckCircle className="h-4 w-4" />,
  closed: <CheckCircle className="h-4 w-4" />
};

export function TicketSystem() {
  const [activeTab, setActiveTab] = useState('create');
  const [tickets, setTickets] = useState<TicketWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const
  });

  const [selectedTicket, setSelectedTicket] = useState<TicketWithResponses | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [addingResponse, setAddingResponse] = useState(false);

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/support/tickets');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description || !newTicket.category) {
      return;
    }

    try {
      setCreatingTicket(true);
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTicket),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const data = await response.json();
      setTickets([data.ticket, ...tickets]);
      setNewTicket({ title: '', description: '', category: '', priority: 'medium' });
      setActiveTab('my-tickets');
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleAddResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;

    try {
      setAddingResponse(true);
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newResponse }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add response');
      }

      const data = await response.json();
      const updatedTicket = {
        ...selectedTicket,
        responses: [...(selectedTicket.responses || []), data.response],
      };

      setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setNewResponse('');
    } catch (err) {
      console.error('Error adding response:', err);
      setError(err instanceof Error ? err.message : 'Failed to add response');
    } finally {
      setAddingResponse(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete ticket');
      }

      setTickets(tickets.filter(t => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete ticket');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Ticket
          </TabsTrigger>
          <TabsTrigger value="my-tickets" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            My Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
              <CardDescription>
                Submit a new support ticket and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Subject</Label>
                <Input
                  id="title"
                  placeholder="Brief description of your issue"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Billing">Billing</option>
                  <option value="Account">Account</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue..."
                  rows={5}
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                />
              </div>

                             <Button 
                 onClick={handleCreateTicket}
                 disabled={!newTicket.title || !newTicket.description || !newTicket.category || creatingTicket}
                 className="w-full"
               >
                 {creatingTicket ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Creating...
                   </>
                 ) : (
                   'Create Ticket'
                 )}
               </Button>
            </CardContent>
          </Card>
        </TabsContent>

                 <TabsContent value="my-tickets" className="space-y-4">
           {loading ? (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="h-8 w-8 animate-spin" />
               <span className="ml-2">Loading tickets...</span>
             </div>
           ) : error ? (
             <div className="text-center py-8 text-red-600">
               <AlertCircle className="h-8 w-8 mx-auto mb-2" />
               <p>{error}</p>
               <Button onClick={fetchTickets} className="mt-4">Try Again</Button>
             </div>
           ) : tickets.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>No tickets found</p>
               <p className="text-sm">Create your first support ticket to get started</p>
             </div>
           ) : (
             <div className="grid gap-4">
               {tickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {ticket.description.length > 100 
                          ? `${ticket.description.substring(0, 100)}...` 
                          : ticket.description
                        }
                      </CardDescription>
                    </div>
                                         <div className="flex items-center gap-2 ml-4">
                       {statusIcons[ticket.status]}
                       <Badge className={statusColors[ticket.status]}>
                         {ticket.status.replace('_', ' ')}
                       </Badge>
                       {ticket.status === 'open' && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDeleteTicket(ticket.id);
                           }}
                           className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                         >
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       )}
                     </div>
                  </div>
                                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                     <div className="flex items-center gap-1">
                       <Calendar className="h-3 w-3" />
                       {formatDate(ticket.created_at)}
                     </div>
                     <Badge className={priorityColors[ticket.priority]}>
                       {ticket.priority}
                     </Badge>
                     <div className="flex items-center gap-1">
                       <User className="h-3 w-3" />
                       {ticket.category}
                     </div>
                   </div>
                </CardHeader>
                               </Card>
               ))}
             </div>
           )}

          {selectedTicket && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedTicket.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[selectedTicket.status]}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={priorityColors[selectedTicket.priority]}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </CardTitle>
                                 <CardDescription>
                   Created on {formatDate(selectedTicket.created_at)}
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>

                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Responses</h4>
                    {selectedTicket.responses.map((response) => (
                                             <div 
                         key={response.id} 
                         className={`p-3 rounded-lg ${
                           response.is_from_support 
                             ? 'bg-blue-50 border-l-4 border-blue-500' 
                             : 'bg-gray-50 border-l-4 border-gray-500'
                         }`}
                       >
                         <div className="flex items-center justify-between mb-2">
                           <span className="font-medium text-sm">
                             {response.author_name}
                           </span>
                           <span className="text-xs text-muted-foreground">
                             {formatDate(response.created_at)}
                           </span>
                         </div>
                         <p className="text-sm">{response.message}</p>
                       </div>
                    ))}
                  </div>
                )}

                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-2">
                    <Label htmlFor="response">Add Response</Label>
                    <Textarea
                      id="response"
                      placeholder="Type your response..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      rows={3}
                    />
                                         <Button 
                       onClick={handleAddResponse}
                       disabled={!newResponse.trim() || addingResponse}
                       size="sm"
                     >
                       {addingResponse ? (
                         <>
                           <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                           Sending...
                         </>
                       ) : (
                         'Send Response'
                       )}
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

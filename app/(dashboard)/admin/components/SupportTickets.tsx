'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Ticket, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Reply,
  Eye,
  Archive,
  Loader2,
  User,
  RefreshCw
} from 'lucide-react';
import { TicketWithResponses, TicketStatus } from '@/lib/types/database';

interface SupportTicketsProps {
  tickets?: TicketWithResponses[];
}

export function SupportTickets({ tickets: initialTickets }: SupportTicketsProps) {
  const [tickets, setTickets] = useState<TicketWithResponses[]>(initialTickets || []);
  const [loading, setLoading] = useState(!initialTickets);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [selectedTicket, setSelectedTicket] = useState<TicketWithResponses | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  // Fetch tickets if not provided
  useEffect(() => {
    if (!initialTickets) {
      fetchTickets();
    }
  }, [initialTickets]);

  // Auto-refresh tickets every 30 seconds
  useEffect(() => {
    if (!initialTickets) {
      const interval = setInterval(() => {
        fetchTickets();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [initialTickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/support/tickets');
      
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  const urgentTickets = tickets.filter(t => t.priority === 'urgent');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-blue-100 text-blue-800';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return variants[priority as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setReplying(true);
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }

      // Refresh tickets to get updated data
      await fetchTickets();
      setReplyMessage('');
      
      // Show success message
      alert('Response sent successfully!');
      
      // Keep the ticket open to show the new response
      // setSelectedTicket(null);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Refresh tickets to get updated data
      await fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <div className="text-xs text-muted-foreground">
              All tickets
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <div className="text-xs text-muted-foreground">
              Awaiting response
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets.length}</div>
            <div className="text-xs text-muted-foreground">
              Being worked on
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tickets</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentTickets.length}</div>
            <div className="text-xs text-muted-foreground">
              High priority
            </div>
          </CardContent>
        </Card>
      </div>

             {/* Search and Filters */}
       <div className="flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Search tickets by title, description, or category..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-10"
           />
         </div>
         
         <div className="flex gap-2">
           <select
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value as any)}
             className="px-3 py-2 border border-gray-300 rounded-md text-sm"
           >
             <option value="all">All Status</option>
             <option value="open">Open</option>
             <option value="in_progress">In Progress</option>
             <option value="resolved">Resolved</option>
             <option value="closed">Closed</option>
           </select>
           
           <select
             value={filterPriority}
             onChange={(e) => setFilterPriority(e.target.value as any)}
             className="px-3 py-2 border border-gray-300 rounded-md text-sm"
           >
             <option value="all">All Priority</option>
             <option value="low">Low</option>
             <option value="medium">Medium</option>
             <option value="high">High</option>
             <option value="urgent">Urgent</option>
           </select>

           <Button
             onClick={fetchTickets}
             disabled={loading}
             variant="outline"
             size="sm"
             className="flex items-center gap-2"
           >
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             Refresh
           </Button>
         </div>
       </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>
            Manage customer support tickets. Found {filteredTickets.length} tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading tickets...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <Button onClick={fetchTickets} className="mt-4">Try Again</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                                 <div 
                   key={ticket.id} 
                   className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                     selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                   }`}
                   onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                 >
                   <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm">{ticket.title}</h3>
                          <Badge className={getStatusBadge(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityBadge(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.category}
                          </span>
                          <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                          <span>Updated {new Date(ticket.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                                                                    <Button
                         size="sm"
                         variant={selectedTicket?.id === ticket.id ? "default" : "outline"}
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket);
                         }}
                       >
                         {selectedTicket?.id === ticket.id ? (
                           <XCircle className="h-3 w-3" />
                         ) : (
                           <Eye className="h-3 w-3" />
                         )}
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleStatusChange(ticket.id, 'in_progress');
                         }}
                         disabled={ticket.status === 'in_progress'}
                       >
                         Start
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleStatusChange(ticket.id, 'resolved');
                         }}
                         disabled={ticket.status === 'resolved'}
                       >
                         Resolve
                       </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTickets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tickets found</p>
                  {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') && (
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ticket #{selectedTicket.id}</span>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadge(selectedTicket.status)}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityBadge(selectedTicket.priority)}>
                  {selectedTicket.priority}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Category: {selectedTicket.category} • Created: {new Date(selectedTicket.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Title</h4>
                <p className="text-sm text-muted-foreground">{selectedTicket.title}</p>
              </div>
              
                             <div>
                 <h4 className="font-medium mb-2">Description</h4>
                 <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-sm">{selectedTicket.description}</p>
                 </div>
               </div>

               {/* Display existing responses */}
               {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                 <div>
                   <h4 className="font-medium mb-2">Responses ({selectedTicket.responses.length})</h4>
                   <div className="space-y-3 max-h-60 overflow-y-auto">
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
                             {response.is_from_support && (
                               <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                                 Support
                               </Badge>
                             )}
                           </span>
                           <span className="text-xs text-muted-foreground">
                             {new Date(response.created_at).toLocaleString()}
                           </span>
                         </div>
                         <p className="text-sm">{response.message}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
               
               <div>
                 <h4 className="font-medium mb-2">Reply</h4>
                 <Textarea
                   value={replyMessage}
                   onChange={(e) => setReplyMessage(e.target.value)}
                   placeholder="Type your reply..."
                   rows={4}
                 />
               </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleReply} 
                  disabled={!replyMessage.trim() || replying}
                  className="flex items-center gap-2"
                >
                  {replying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Reply className="h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTicket(null)}
                  disabled={replying}
                >
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange(selectedTicket.id, 'resolved')}
                  disabled={replying}
                >
                  Mark Resolved
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

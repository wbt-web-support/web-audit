'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Zap, Globe, BarChart3, ChevronRight } from 'lucide-react';

export function HelpTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Help Center
        </CardTitle>
        <CardDescription>
          Get help and support for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Help</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Getting Started</p>
                    <p className="text-sm text-muted-foreground">Learn the basics</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Creating Audits</p>
                    <p className="text-sm text-muted-foreground">How to audit websites</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Understanding Reports</p>
                    <p className="text-sm text-muted-foreground">Read your audit results</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support Options</h3>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Email Support</h4>
                <p className="text-sm text-muted-foreground mb-3">Get help via email within 24 hours</p>
                <Button variant="outline" size="sm">Contact Support</Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Live Chat</h4>
                <p className="text-sm text-muted-foreground mb-3">Chat with our support team</p>
                <Button variant="outline" size="sm">Start Chat</Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Documentation</h4>
                <p className="text-sm text-muted-foreground mb-3">Browse our comprehensive docs</p>
                <Button variant="outline" size="sm">View Docs</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

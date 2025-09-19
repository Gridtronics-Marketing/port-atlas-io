import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Send, Bell, Users, Settings } from 'lucide-react';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const Communications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { employees } = useEmployees();
  const {
    chatRooms,
    messages,
    notifications,
    isLoading,
    fetchMessages,
    sendMessage,
    createChatRoom,
    markNotificationAsRead
  } = useChatRooms();

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const handleRoomSelect = async (roomId: string) => {
    setSelectedRoom(roomId);
    await fetchMessages(roomId);
  };

  const handleSendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return;
    
    await sendMessage(selectedRoom, newMessage);
    setNewMessage('');
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedParticipants.length === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one participant",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Creating room with:', { newRoomName, selectedParticipants });
    
    const room = await createChatRoom(newRoomName, selectedParticipants);
    if (room) {
      setIsCreateRoomOpen(false);
      setNewRoomName('');
      setSelectedParticipants([]);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read_at);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Communications
        </h1>
        <p className="text-muted-foreground mt-1">
          Team messaging and notifications management
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Team Chat
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
            {/* Chat Rooms List */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Chat Rooms</CardTitle>
                  <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Room
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Chat Room</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="roomName">Room Name</Label>
                          <Input
                            id="roomName"
                            placeholder="Enter room name"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Select Participants</Label>
                          <ScrollArea className="h-40 border rounded p-2">
                            {employees.map((employee) => (
                              <div key={employee.id} className="flex items-center space-x-2 p-2">
                                <Checkbox
                                  id={employee.id}
                                  checked={selectedParticipants.includes(employee.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedParticipants([...selectedParticipants, employee.id]);
                                    } else {
                                      setSelectedParticipants(selectedParticipants.filter(id => id !== employee.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={employee.id}>
                                  {employee.first_name} {employee.last_name} ({employee.role})
                                </Label>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                        <Button onClick={handleCreateRoom} className="w-full">
                          Create Room
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="text-center text-muted-foreground">Loading...</div>
                  ) : chatRooms.length === 0 ? (
                    <div className="text-center text-muted-foreground">No chat rooms yet</div>
                  ) : (
                    <div className="space-y-2">
                      {chatRooms.map((room) => (
                        <Card
                          key={room.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedRoom === room.id ? 'bg-muted border-primary' : ''
                          }`}
                          onClick={() => handleRoomSelect(room.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{room.name}</h4>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{room.type === 'group' ? 'Group' : 'Direct'}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card className="lg:col-span-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {selectedRoom ? (
                    chatRooms.find(r => r.id === selectedRoom)?.name || 'Chat'
                  ) : (
                    'Select a chat room'
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRoom ? (
                  <div className="flex flex-col h-[500px]">
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-3">
                        {messages[selectedRoom]?.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {format(new Date(message.created_at), 'MMM d, HH:mm')}
                              </p>
                            </div>
                          </div>
                        )) || []}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    Select a chat room to start messaging
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {notifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          !notification.read_at ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{notification.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                                {notification.sent_via_twilio && (
                                  <Badge variant="secondary" className="text-xs">
                                    SMS
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Communications;
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  timestamp: string;
}

interface LobbyChatProps {
  sessionId: string;
  playerNickname: string;
}

const LobbyChat = ({ sessionId, playerNickname }: LobbyChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabase();
    if (!supabase) return;

    // Create a broadcast channel for chat messages
    const channel = supabase.channel(`chat-${sessionId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    channel
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        const msg = payload.payload as ChatMessage;
        setMessages((prev) => [...prev, msg]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !channelRef.current) return;

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      nickname: playerNickname,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: chatMessage
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Lobby Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-56">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No messages yet. Say hello!
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-2 ${
                  msg.nickname === playerNickname
                    ? 'bg-primary/10 ml-4'
                    : 'bg-muted mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${
                    msg.nickname === playerNickname ? 'text-primary' : 'text-foreground'
                  }`}>
                    {msg.nickname === playerNickname ? 'You' : msg.nickname}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-3">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            maxLength={200}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LobbyChat;

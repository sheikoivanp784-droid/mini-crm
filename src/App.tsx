import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import axios from 'axios';

interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
}

interface Note {
  id: string;
  client_id: string;
  text: string;
  ai_summary: string;
  ai_tags: string[];
  ai_sentiment: string;
  created_at: string;
}

export default function App() {
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 15));

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', status: 'Новый' });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) fetchNotes(selectedClient.id);
  }, [selectedClient]);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) console.error('fetchClients error:', error);
    if (data) setClients(data);
  };

  const fetchNotes = async (clientId: string) => {
    const { data, error } = await supabase.from('notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) console.error('fetchNotes error:', error);
    if (data) setNotes(data);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('clients').insert([form]).select();
    if (error) {
      console.error('insert client error:', error);
      alert('Ошибка сохранения клиента: ' + error.message);
      return;
    }
    if (data) {
      setClients([data[0], ...clients]);
      setForm({ name: '', company: '', phone: '', email: '', status: 'Новый' });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedClient) return;

    setLoadingAi(true);

    let ai_summary = '';
    let ai_tags: string[] = [];
    let ai_sentiment = 'нейтральный';

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (apiKey) {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Проанализируй заметку и верни JSON: {"summary": "1 предложение", "tags": ["тег1", "тег2"], "sentiment": "позитивный" | "нейтральный" | "негативный"}'
              },
              { role: 'user', content: newNote }
            ],
            response_format: { type: 'json_object' }
          },
          { headers: { Authorization: 'Bearer ' + apiKey } }
        );

        const aiData = JSON.parse(response.data.choices[0].message.content);
        ai_summary = aiData.summary;
        ai_tags = aiData.tags;
        ai_sentiment = aiData.sentiment;
      }
    } catch (err) {
      console.error('Ошибка AI:', err);
    } finally {
      setLoadingAi(false);
    }

    const { data, error } = await supabase.from('notes').insert([
      {
        client_id: selectedClient.id,
        text: newNote,
        ai_summary,
        ai_tags,
        ai_sentiment
      }
    ]).select();

    if (error) {
      console.error('insert note error:', error);
      alert('Ошибка сохранения заметки: ' + error.message);
      return;
    }

    if (data) {
      setNotes([data[0], ...notes]);
      setNewNote('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Мини-CRM Клиенты</h1>
        
        <form onSubmit={handleCreateClient} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="Имя" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input className="border p-2 rounded" placeholder="Компания" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Телефон" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <select className="border p-2 rounded col-span-2" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="Новый">Новый</option>
            <option value="В работе">В работе</option>
            <option value="Закрыт">Закрыт</option>
          </select>
          <button className="col-span-2 bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700">Добавить клиента</button>
        </form>

        <table className="w-full bg-white rounded shadow text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Имя</th>
              <th className="p-3">Компания</th>
              <th className="p-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr 
                key={c.id} 
                onClick={() => setSelectedClient(c)} 
                className={`border-b cursor-pointer hover:bg-blue-50 ${selectedClient?.id === c.id ? 'bg-blue-100' : ''}`}
              >
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.company}</td>
                <td className="p-3"><span className="px-2 py-1 bg-gray-200 text-xs rounded">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="w-1/2 p-6 overflow-y-auto">
        {selectedClient ? (
          <div>
            <h2 className="text-xl font-bold mb-1">{selectedClient.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedClient.company} | {selectedClient.email} | {selectedClient.phone}</p>

            <form onSubmit={handleAddNote} className="mb-6">
              <textarea 
                className="w-full border p-3 rounded mb-2" 
                rows={3} 
                placeholder="Введите заметку..." 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
              />
              <button disabled={loadingAi} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                {loadingAi ? 'AI анализирует...' : 'Добавить заметку'}
              </button>
            </form>

            <div className="space-y-4">
              {notes.map(n => (
                <div key={n.id} className="bg-white p-4 rounded shadow border border-gray-100">
                  <p className="mb-2 font-medium">{n.text}</p>
                  
                  {n.ai_summary && (
                    <div className="bg-purple-50 p-3 rounded border border-purple-100 text-sm">
                      <p className="text-purple-900 font-semibold mb-1">AI Summary: {n.ai_summary}</p>
                      <div className="flex gap-2 my-2">
                        {n.ai_tags?.map((tag, i) => (
                          <span key={i} className="bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                      <p className="text-xs text-purple-700">Sentiment: <b>{n.ai_sentiment}</b></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 flex items-center justify-center h-full">Выберите клиента из списка</div>
        )}
      </div>
    </div>
  );
}
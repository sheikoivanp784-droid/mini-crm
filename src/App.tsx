import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', status: 'Новый' });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchNotes(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (!error && data) setClients(data);
  };

  const fetchNotes = async (clientId: string) => {
    const { data, error } = await supabase.from('notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (!error && data) setNotes(data);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const { data, error } = await supabase.from('clients').insert([form]).select();
    if (!error && data) {
      setClients([data[0], ...clients]);
      setForm({ name: '', company: '', phone: '', email: '', status: 'Новый' });
    }
  };

  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этого клиента?')) return;

    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      setClients(clients.filter(c => c.id !== id));
      if (selectedClient?.id === id) setSelectedClient(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedClient) return;

    const notePayload = {
      client_id: selectedClient.id,
      text: newNote,
      ai_summary: 'Заметка успешно сохранена',
      ai_tags: ['клиент'],
      ai_sentiment: 'нейтральный'
    };

    const { data, error } = await supabase.from('notes').insert([notePayload]).select();
    if (!error && data) {
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
              <th className="p-3 text-right">Действия</th>
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
                <td className="p-3 text-right">
                  <button 
                    onClick={(e) => handleDeleteClient(c.id, e)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
                  >
                    Удалить
                  </button>
                </td>
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
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Добавить заметку
              </button>
            </form>

            <div className="space-y-4">
              {notes.map(n => (
                <div key={n.id} className="bg-white p-4 rounded shadow border border-gray-100">
                  <p className="mb-2 font-medium">{n.text}</p>
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

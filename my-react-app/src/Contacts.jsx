import React, { useEffect, useState } from 'react';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/contacts');
                const data = await res.json();
                setContacts(data);
            } catch (e) {
                console.error('Failed to load contacts', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addContact = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;
        // basic phone normalization: remove spaces
        const sanitized = phone.replace(/[^0-9+]/g, '');
        setSubmitting(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), phone: sanitized })
            });
            if (!res.ok) throw new Error('Failed to add');
            const body = await res.json();
            setContacts(body.contacts || []);
            setName('');
            setPhone('');
        } catch (err) {
            console.error(err);
            alert('Failed to add contact');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section style={{marginTop:20, textAlign:'left'}}>
            <h2>Emergency Contacts</h2>

            <form onSubmit={addContact} style={{display:'flex', gap:8, marginBottom:12}}>
                <input
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    aria-label="Contact name"
                    style={{flex:1, padding:8}}
                    required
                />
                <input
                    placeholder="Phone (digits or +country)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    aria-label="Contact phone"
                    style={{width:160, padding:8}}
                    required
                />
                <button type="submit" disabled={submitting} style={{padding:'8px 12px'}}>
                    {submitting ? 'Adding...' : 'Add'}
                </button>
            </form>

            {loading ? (
                <div>Loading contacts…</div>
            ) : contacts.length ? (
                <ul>
                    {contacts.map((c, i) => (
                        <li key={i}>{c.name} — {c.phone}</li>
                    ))}
                </ul>
            ) : (
                <div>No contacts configured.</div>
            )}
        </section>
    );
}
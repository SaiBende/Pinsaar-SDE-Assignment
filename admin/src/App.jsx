import { useEffect, useState } from "react";
import CreateNoteForm from "./components/CreateNoteForm";
import NotesTable from "./components/NotesTable";
import { getNotes, replayNote } from "./api";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchNotes = async (pageNum = 1) => {
    try {
      const res = await getNotes(pageNum);
      const data = res.data.notes || [];
      setNotes(data);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error("Error fetching notes:", err.message);
      setNotes([]);
    }
  };

  const handleReplay = async (id) => {
    await replayNote(id);
    fetchNotes(page);
  };

   useEffect(() => {
    fetchNotes(page);

    //  auto-refresh every 2 seconds
    const interval = setInterval(() => {
      fetchNotes(page);
    }, 2000);

    return () => clearInterval(interval); // cleanup on unmount
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📒 DropLater Admin</h1>
      <CreateNoteForm onCreated={() => fetchNotes(page)} />
      <NotesTable
        notes={notes}
        onReplay={handleReplay}
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  );
}

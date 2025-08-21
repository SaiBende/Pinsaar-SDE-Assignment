import { motion } from "framer-motion";
import dayjs from "dayjs";

export default function NotesTable({ notes, onReplay, pagination, onPageChange }) {
  return (
    <div className="mt-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Id</th>
              <th className="border p-2">Title</th>
              <th className="border p-2">Release At</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Last Code</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => {
              const lastAttempt = note.attempts?.[note.attempts.length - 1];
              const statusColors = {
                pending: "bg-yellow-200 text-yellow-800",
                delivered: "bg-green-200 text-green-800",
                failed: "bg-red-200 text-red-800",
                dead: "bg-gray-300 text-gray-700",
              };

              return (
                <motion.tr
                  key={note._id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor:
                      note.status === "delivered" ? "#bbf7d0" : "#ffffff",
                  }}
                  transition={{ duration: 0.5 }}
                  className="border"
                >
                  <td className="border p-2">{note._id}</td>
                  <td className="border p-2">{note.title}</td>
                  <td className="border p-2">
                    {dayjs(note.releaseAt).format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        statusColors[note.status] || "bg-gray-100"
                      }`}
                    >
                      {note.status}
                    </span>
                  </td>
                  <td className="border p-2">{lastAttempt?.statusCode || "-"}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => onReplay(note._id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                      disabled={note.status === "pending"}
                    >
                      Replay
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
            }
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

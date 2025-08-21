import { useForm } from "react-hook-form";
import { useState } from "react";
import { createNote } from "../api";

export default function CreateNoteForm({ onCreated }) {
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Convert datetime-local → ISO 8601
      data.releaseAt = new Date(data.releaseAt).toISOString();

      await createNote(data);
      reset();          // clear form
      onCreated();      // refresh notes list
    } catch (err) {
      console.error("Error creating note:", err.message);
      alert("Failed to create note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 p-4 border rounded-lg shadow bg-white"
    >
      <input
        {...register("title")}
        placeholder="Title"
        required
        className="border p-2 rounded"
      />
      <textarea
        {...register("body")}
        placeholder="Body"
        required
        className="border p-2 rounded"
      />
      <input
        {...register("releaseAt")}
        type="datetime-local"
        required
        className="border p-2 rounded"
      />
      <input
        {...register("webhookUrl")}
        placeholder="Webhook URL"
        required
        className="border p-2 rounded"
        defaultValue={"http://localhost:4000/sink"}
      />

      <button
        type="submit"
        disabled={loading}
        className={`${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white py-2 rounded`}
      >
        {loading ? "Creating..." : "Create Note"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";

const dishSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  is_available: z.boolean().optional(),
});

type DishFormValues = z.infer<typeof dishSchema>;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
const MAX_MB = 5;

type Props = {
  onCreated?: () => void;
};

export default function AddDishForm({ onCreated }: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: { is_available: true },
  });

  const onSubmit = async (data: DishFormValues) => {
    try {
      setUploading(true);
      setProgress(0);
      setMessage(null);
      setError(null);
      let imageUrl = "";

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) throw new Error("File must be an image");
        if (imageFile.size > MAX_MB * 1024 * 1024) throw new Error(`Image must be < ${MAX_MB}MB`);

        const { data: sigData } = await axios.get(`${API_BASE}/upload/signature`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp);
        formData.append("signature", sigData.signature);
        formData.append("upload_preset", sigData.uploadPreset);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
          formData,
          {
            onUploadProgress: (evt) =>
              setProgress(Math.round((evt.loaded / (evt.total || 1)) * 100)),
          },
        );

        imageUrl = cloudinaryRes.data.secure_url;
      }

      await axios.post(
        `${API_BASE}/menu`,
        { ...data, price: Number(data.price), image_url: imageUrl },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
      );

      reset();
      setImageFile(null);
      setProgress(0);
      setMessage("Dish created");
      onCreated?.();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Failed to create dish");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded bg-white shadow-md space-y-4">
      <div>
        <label className="block mb-1">Dish Name</label>
        <input {...register("name") } className="border p-2 w-full" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block mb-1">Price</label>
        <input
          type="number"
          step="0.01"
          {...register("price", { valueAsNumber: true }) }
          className="border p-2 w-full"
        />
        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
      </div>

      <div>
        <label className="block mb-1">Category</label>
        <select {...register("category") } className="border p-2 w-full">
          <option value="Starters">Starters</option>
          <option value="Main Course">Main Course</option>
          <option value="Desserts">Desserts</option>
        </select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
      </div>

      <div>
        <label className="block mb-1">Description</label>
        <textarea {...register("description") } className="border p-2 w-full" rows={3} />
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" id="is_available" {...register("is_available") } />
        <label htmlFor="is_available">Available</label>
      </div>

      <div>
        <label className="block mb-1">Image (max {MAX_MB}MB)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="border p-2 w-full"
        />
        {uploading && imageFile && <p className="text-sm text-gray-600">Uploading: {progress}%</p>}
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Add Dish"}
      </button>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { supabase } from "@/lib/supabase";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight,
  ImageIcon, Link2, Link2Off,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800" },
      }),
      Placeholder.configure({ placeholder: placeholder || "Description du produit..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
    immediatelyRender: false,
  });

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files || !editor) return;
      setUploading(true);
      try {
        const { data: bucket } = await supabase.storage.getBucket("products");
        if (!bucket) {
          await supabase.storage.createBucket("products", { public: true });
        }
        for (const file of Array.from(files)) {
          const fileName = `${Date.now()}-${file.name}`;
          const { error } = await supabase.storage
            .from("products")
            .upload(fileName, file);
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);
          editor.chain().focus().setImage({ src: publicUrl }).run();
        }
      } catch (error) {
        console.error("Image upload error:", error);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien:", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolButton = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-200" />;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-gray-200 bg-gray-50/50">
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné">
          <UnderlineIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
          <Strikethrough className="w-4 h-4" />
        </ToolButton>

        <Divider />

        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Titre 1">
          <Heading1 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre 2">
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Titre 3">
          <Heading3 className="w-4 h-4" />
        </ToolButton>

        <Divider />

        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces">
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
          <Quote className="w-4 h-4" />
        </ToolButton>

        <Divider />

        <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Aligné à gauche">
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centré">
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Aligné à droite">
          <AlignRight className="w-4 h-4" />
        </ToolButton>

        <Divider />

        <ToolButton onClick={handleImageUpload} title="Insérer une image">
          <ImageIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={setLink} active={editor.isActive("link")} title="Ajouter un lien">
          <Link2 className="w-4 h-4" />
        </ToolButton>
        {editor.isActive("link") && (
          <ToolButton onClick={() => editor.chain().focus().unsetLink().run()} title="Supprimer le lien">
            <Link2Off className="w-4 h-4" />
          </ToolButton>
        )}
      </div>

      <EditorContent editor={editor} />

      {uploading && (
        <div className="px-4 py-2 text-xs text-emerald-600 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
          <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Téléchargement des images...
        </div>
      )}
    </div>
  );
}

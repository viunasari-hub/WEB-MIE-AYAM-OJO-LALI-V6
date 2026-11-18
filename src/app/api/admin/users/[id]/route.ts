import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (session.id === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Detach user's orders so sales history is preserved
    await prisma.order.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Data ${user.role === "CUSTOMER" ? "pelanggan" : "pengguna"} ${user.name} berhasil dihapus`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}

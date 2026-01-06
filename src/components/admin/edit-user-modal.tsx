'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  phone: string | null
  isActive: boolean
  mitraStatus: string | null
}

interface EditUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: '',
    isActive: true,
    mitraStatus: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        isActive: user.isActive,
        mitraStatus: user.mitraStatus || '',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const updateData: {
        role: string
        isActive: boolean
        mitraStatus?: string
      } = {
        role: formData.role,
        isActive: formData.isActive,
      }

      if (formData.role === 'MITRA' && formData.mitraStatus) {
        updateData.mitraStatus = formData.mitraStatus
      }

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update user')
      }

      toast.success('User updated successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">User Details</p>
          <p className="mt-1 font-medium text-gray-900">{user.name || 'N/A'}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        {isSuperAdmin ? (
          <div className="rounded-lg bg-yellow-50 p-4 text-center">
            <p className="text-sm text-yellow-800">
              SUPER_ADMIN cannot be modified
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="TECHNICIAN">Teknisi</option>
                <option value="ADMIN">Admin</option>
                <option value="MITRA">Mitra</option>
              </select>
            </div>

            {formData.role === 'MITRA' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mitra Status
                </label>
                <select
                  value={formData.mitraStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, mitraStatus: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 font-medium text-white hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  'Update User'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

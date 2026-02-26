'use client'

import { useState } from 'react'

interface Device {
  id: string
  fingerprint: string
  name: string | null
  lastSeen: Date
  createdAt: Date
}

interface DeviceListProps {
  devices: Device[]
}

export function DeviceList({ devices: initialDevices }: DeviceListProps) {
  const [devices, setDevices] = useState(initialDevices)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(deviceId: string) {
    setRemoving(deviceId)
    try {
      const res = await fetch('/api/user/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })

      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== deviceId))
      }
    } catch {
      // silently fail
    } finally {
      setRemoving(null)
    }
  }

  if (devices.length === 0) {
    return <p className="text-gray-500">Nu ai niciun dispozitiv inregistrat.</p>
  }

  return (
    <ul className="space-y-3">
      {devices.map((device) => (
        <li
          key={device.id}
          className="flex items-center justify-between p-3 bg-[#FDF2F8] rounded-lg"
        >
          <div>
            <p className="font-medium text-[#2D1B69]">
              {device.name || 'Dispozitiv necunoscut'}
            </p>
            <p className="text-xs text-gray-500">
              {device.fingerprint.substring(0, 8)}... · Ultima activitate:{' '}
              {new Date(device.lastSeen).toLocaleDateString('ro-RO')}
            </p>
          </div>
          <button
            onClick={() => handleRemove(device.id)}
            disabled={removing === device.id}
            className="text-red-500 text-sm font-medium hover:text-red-700 disabled:opacity-50"
          >
            {removing === device.id ? 'Se elimina...' : 'Elimina'}
          </button>
        </li>
      ))}
    </ul>
  )
}

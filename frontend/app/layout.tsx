
import './globals.css'
export const metadata = { title: 'Pi Bike Insure - Two Wheeler Insurance with Pi', description: 'Pay 10% Pi at GCV + 90% INR' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}

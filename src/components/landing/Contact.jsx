import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi'
import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import Button from '../ui/Button'
import Card from '../ui/Card'
import api from '../../services/api'

export default function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      await api.post('/contact', data)
      toast.success('Message sent successfully! We will get back to you soon.')
      reset()
    } catch {
      toast.error('Failed to send message. Please try again later.')
    }
  }

  return (
    <section id="contact" className="bg-prastav-50 py-20 lg:py-28">
      <Container>
        <SectionTitle
          eyebrow="Contact Us"
          title="Get in Touch"
          subtitle="Have questions or feedback? We'd love to hear from you."
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <Card hover={false} className="shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-prastav-500 focus:ring-2 focus:ring-prastav-200"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-prastav-500 focus:ring-2 focus:ring-prastav-200"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="How can we help you?"
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-prastav-500 focus:ring-2 focus:ring-prastav-200"
                  {...register('message', { required: 'Message is required' })}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </Card>

          <div className="space-y-6">
            <Card hover={false}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-prastav-100">
                  <HiOutlineMail className="h-6 w-6 text-prastav-700" />
                </div>
                <div>
                  <h3 className="font-bold text-prastav-900">Email</h3>
                  <p className="mt-1 text-sm text-gray-600">support@prastav.com.np</p>
                </div>
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-prastav-100">
                  <HiOutlinePhone className="h-6 w-6 text-prastav-700" />
                </div>
                <div>
                  <h3 className="font-bold text-prastav-900">Phone</h3>
                  <p className="mt-1 text-sm text-gray-600">+977 9800000000</p>
                </div>
              </div>
            </Card>

            <Card hover={false}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-prastav-100">
                  <HiOutlineLocationMarker className="h-6 w-6 text-prastav-700" />
                </div>
                <div>
                  <h3 className="font-bold text-prastav-900">Location</h3>
                  <p className="mt-1 text-sm text-gray-600">Kathmandu, Nepal</p>
                </div>
              </div>
            </Card>

            <div className="overflow-hidden rounded-2xl shadow-md">
              <iframe
                title="Prastav Location"
                src="https://maps.google.com/maps?q=Kathmandu,Nepal&z=13&output=embed"
                className="h-64 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

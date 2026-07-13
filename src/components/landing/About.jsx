import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import Card from '../ui/Card'
import { APP_DESCRIPTION } from '../../utils/constants'
import { HiOutlineAcademicCap, HiOutlineGlobeAlt, HiOutlineHeart } from 'react-icons/hi'

const highlights = [
  {
    icon: HiOutlineAcademicCap,
    title: 'Built for Students',
    text: 'Designed specifically for Nepal\'s academic community from Grade 1 to University.',
  },
  {
    icon: HiOutlineGlobeAlt,
    title: 'Nationwide Reach',
    text: 'Serving all 77 districts with location-aware nearby seller discovery.',
  },
  {
    icon: HiOutlineHeart,
    title: 'Sustainable Sharing',
    text: 'Reduce waste by exchanging, donating, and reusing academic resources.',
  },
]

export default function About() {
  return (
    <section id="about" className="bg-white py-20 lg:py-28">
      <Container>
        <SectionTitle
          eyebrow="Why Prastav"
          title="About Prastav"
          subtitle={APP_DESCRIPTION}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-prastav-100">
                <Icon className="h-7 w-7 text-prastav-700" />
              </div>
              <h3 className="text-lg font-bold text-prastav-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}

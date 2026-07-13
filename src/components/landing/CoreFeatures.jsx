import {
  HiOutlineShoppingCart,
  HiOutlineCurrencyDollar,
  HiOutlineSwitchHorizontal,
  HiOutlineGift,
  HiOutlineClipboardList,
  HiOutlineLocationMarker,
  HiOutlineSparkles,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from 'react-icons/hi'
import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import Card from '../ui/Card'
import { CORE_FEATURES } from '../../utils/constants'

const iconMap = {
  buy: HiOutlineShoppingCart,
  sell: HiOutlineCurrencyDollar,
  exchange: HiOutlineSwitchHorizontal,
  donate: HiOutlineGift,
  request: HiOutlineClipboardList,
  nearby: HiOutlineLocationMarker,
  recommend: HiOutlineSparkles,
  payment: HiOutlineCreditCard,
  verify: HiOutlineShieldCheck,
  rating: HiOutlineStar,
}

export default function CoreFeatures() {
  return (
    <section id="features" className="bg-prastav-50 py-20 lg:py-28">
      <Container>
        <SectionTitle
          eyebrow="Category"
          title="Core Features"
          subtitle="Everything you need to buy, sell, exchange, and discover academic books in one platform."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CORE_FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon]
            return (
              <Card key={feature.title} className="flex flex-col" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-prastav-100 to-prastav-200">
                  <Icon className="h-6 w-6 text-prastav-700" />
                </div>
                <h3 className="font-bold text-prastav-900">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </Card>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

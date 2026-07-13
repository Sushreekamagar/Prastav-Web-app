import Container from '../ui/Container'
import SectionTitle from '../ui/SectionTitle'
import { HOW_IT_WORKS_STEPS } from '../../utils/constants'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-prastav-50 py-20 lg:py-28">
      <Container>
        <SectionTitle
          eyebrow="Process"
          title="How It Works"
          subtitle="Get started in four simple steps and join Nepal's growing student book community."
        />

        <div className="relative">
          <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-prastav-200 lg:left-1/2 lg:block lg:-translate-x-1/2" />

          <div className="space-y-8 lg:space-y-12">
            {HOW_IT_WORKS_STEPS.map((item, index) => (
              <div
                key={item.step}
                className={`relative flex flex-col gap-6 lg:flex-row lg:items-center ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div
                    className={`rounded-2xl bg-white p-6 shadow-md lg:inline-block lg:max-w-md ${
                      index % 2 === 0 ? 'lg:ml-auto' : 'lg:mr-auto'
                    }`}
                  >
                    <span className="text-sm font-semibold text-prastav-600">
                      Step {item.step}
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-prastav-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-full bg-prastav-800 text-xl font-bold text-white shadow-lg lg:self-center">
                  {item.step}
                </div>

                <div className="hidden flex-1 lg:block" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}

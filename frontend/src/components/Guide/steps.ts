import type { DriveStep } from 'driver.js'

type TourSide = NonNullable<DriveStep['popover']>['side']

const navStep = (
  element: string,
  title: string,
  description: string,
  side: TourSide = 'right',
): DriveStep => ({
  element,
  popover: {
    title,
    description,
    side,
    align: 'center',
    showButtons: ['next', 'previous'],
  },
})

export const getUserSteps = (t: (key: string) => string): DriveStep[] => [
  {
    popover: {
      title: t('onboarding.quick.user.welcome.title'),
      description: t('onboarding.quick.user.welcome.description'),
      align: 'center',
      nextBtnText: t('onboarding.quick.user.welcome.nextBtn'),
      prevBtnText: t('onboarding.quick.user.welcome.prevBtn'),
    },
  },
  navStep(
    '[data-tour="sidebar-models"]',
    t('onboarding.quick.user.models.title'),
    t('onboarding.quick.user.models.description'),
  ),
  navStep(
    '[data-tour="sidebar-my-keys"]',
    t('onboarding.quick.user.keys.title'),
    t('onboarding.quick.user.keys.description'),
  ),
  navStep(
    '[data-tour="sidebar-usage"]',
    t('onboarding.quick.user.usage.title'),
    t('onboarding.quick.user.usage.description'),
  ),
  navStep(
    '[data-tour="sidebar-subscriptions"]',
    t('onboarding.quick.user.billing.title'),
    t('onboarding.quick.user.billing.description'),
  ),
  {
    popover: {
      title: t('onboarding.quick.user.done.title'),
      description: t('onboarding.quick.user.done.description'),
      align: 'center',
      showButtons: ['next', 'previous'],
    },
  },
]

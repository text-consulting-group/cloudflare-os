import { createFileRoute } from '@tanstack/react-router'
import BlueprintsPage from '../BlueprintsPage'
import { useLocale } from '../LocaleContext'
import { useDocumentTitle } from '../useDocumentTitle'

export const Route = createFileRoute('/explore')({
  component: ExplorePage,
})

function ExplorePage() {
  const { t } = useLocale()
  useDocumentTitle(t.explore)

  return <BlueprintsPage />
}

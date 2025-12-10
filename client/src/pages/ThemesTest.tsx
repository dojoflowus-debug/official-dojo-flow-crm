import SimpleLayout from '@/components/SimpleLayout'

export default function ThemesTest() {
  return (
    <SimpleLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground">Themes Test Page</h1>
        <p className="mt-4 text-muted-foreground">
          If you can see this text, the route and SimpleLayout are working correctly.
        </p>
        <div className="mt-8 p-4 bg-card border rounded-lg">
          <p>This is a minimal test page with no complex components.</p>
        </div>
      </div>
    </SimpleLayout>
  )
}

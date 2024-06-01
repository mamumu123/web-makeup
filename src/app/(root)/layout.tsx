import { GitHubAvatar } from '@/components/shared/gitHub';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="root">
      <GitHubAvatar />
      <div className="root-container">
        <div className="wrapper">
          {children}
        </div>
      </div>

    </main>
  )
}

export default Layout;
import { GitHubAvatar } from '@/components/shared/gitHub';
// import SideBar from '@/components/shared/Sidebar'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="root">
      <GitHubAvatar />
      <div className="root-container">
        <div className="wrapper h-full width-full">
          {children}
        </div>
      </div>

    </main>
  )
}

export default Layout;
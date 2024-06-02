import { GitHubAvatar } from '@/components/shared/gitHub';
// import SideBar from '@/components/shared/Sidebar'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="root">
      <GitHubAvatar />
      <div className="root-container bg-rose-200">
        <div className="wrapper h-full width-full ">
          {children}
        </div>
      </div>

    </main>
  )
}

export default Layout;
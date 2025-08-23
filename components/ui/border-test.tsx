export default function BorderTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Border Color Test</h2>
      
      <div className="space-y-2">
        <div className="p-4 border-2 border-border-light bg-background rounded-lg">
          <p className="text-sm">Border Light (Light Mode)</p>
        </div>
        
        <div className="p-4 border-2 border-border-medium bg-background rounded-lg">
          <p className="text-sm">Border Medium (Light Mode)</p>
        </div>
        
        <div className="p-4 border-2 border-border-dark bg-background rounded-lg">
          <p className="text-sm">Border Dark (Light Mode)</p>
        </div>
        
        <div className="p-4 border-2 border-border-darkMode bg-background rounded-lg">
          <p className="text-sm">Border Dark Mode (Light Mode)</p>
        </div>
      </div>
      
      <div className="dark:block hidden space-y-2">
        <div className="p-4 border-2 border-border-light bg-background rounded-lg">
          <p className="text-sm">Border Light (Dark Mode)</p>
        </div>
        
        <div className="p-4 border-2 border-border-medium bg-background rounded-lg">
          <p className="text-sm">Border Medium (Dark Mode)</p>
        </div>
        
        <div className="p-4 border-2 border-border-dark bg-background rounded-lg">
          <p className="text-sm">Border Dark (Dark Mode)</p>
        </div>
        
        <div className="p-4 border-2 border-border-darkMode bg-background rounded-lg">
          <p className="text-sm">Border Dark Mode (Dark Mode)</p>
        </div>
      </div>
    </div>
  );
}

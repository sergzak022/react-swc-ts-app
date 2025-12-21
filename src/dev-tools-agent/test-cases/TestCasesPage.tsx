import { AgentFallbackProvider } from './AgentFallbackContext';
import { AgentFallbackToggle } from './components/AgentFallbackToggle';
import { TestIdVariations } from './components/TestIdVariations';
import { CssSelectorScenarios } from './components/CssSelectorScenarios';
import { DynamicContent } from './components/DynamicContent';
import { EdgeCases } from './components/EdgeCases';
import { ComponentPatterns } from './components/ComponentPatterns';

export function TestCasesPage() {
  return (
    <AgentFallbackProvider>
      <TestCasesPageContent />
    </AgentFallbackProvider>
  );
}

function TestCasesPageContent() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">UI-Agent Test Cases</h1>
        <p className="text-gray-600">
          Click any test element to trigger UI-Agent resolution. 
          Open UI-Agent overlay (🎯 button) first.
        </p>
      </header>
      
      {/* Agent Fallback Toggle */}
      <AgentFallbackToggle />
      
      {/* Navigation */}
      <nav className="mb-6 flex gap-4 flex-wrap">
        <a href="#testid" className="text-blue-600 hover:underline">data-testid</a>
        <a href="#css" className="text-blue-600 hover:underline">CSS Selectors</a>
        <a href="#dynamic" className="text-blue-600 hover:underline">Dynamic Content</a>
        <a href="#edge" className="text-blue-600 hover:underline">Edge Cases</a>
        <a href="#component" className="text-blue-600 hover:underline">Component Patterns</a>
      </nav>
      
      {/* Test Categories */}
      <div className="space-y-12">
        <section id="testid">
          <TestIdVariations />
        </section>
        
        <section id="css">
          <CssSelectorScenarios />
        </section>
        
        <section id="dynamic">
          <DynamicContent />
        </section>
        
        <section id="edge">
          <EdgeCases />
        </section>
        
        <section id="component">
          <ComponentPatterns />
        </section>
      </div>
    </div>
  );
}


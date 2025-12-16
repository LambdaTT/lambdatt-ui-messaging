// src/index.js

// Enpoints:
import ENDPOINTS from './src/ENDPOINTS.js'

export const NAME = 'messaging'

function mapServices() {
  const services = import.meta.globEager('./src/services/**/*.js');

  const servicesMap = {};
  for (const path in services) {
    const mod = services[path];
    // Extract the service name from the file path
    const parts = path.split('/');
    const serviceName = parts.pop().replace(/\.\w+$/, '');
    const serviceUri = [...parts.slice(3), serviceName].join('.');
    servicesMap[serviceUri] = mod.default;
  }

  return servicesMap;
}

function mapComponents() {
  const components = import.meta.globEager('./src/components/**/*.vue');

  const componentsMap = {};
  for (const path in components) {
    const mod = components[path];
    // Extract the component name from the file path
    const componentName = path.split('/').pop().replace(/\.\w+$/, '');
    componentsMap[componentName] = mod.default;
  }
  return componentsMap;
}

function mapPages() {
  const pages = import.meta.globEager('./src/pages/**/*.vue');

  const pagesMap = {};
  for (const path in pages) {
    const mod = pages[path];
    const configs = mod.__PAGE_CONFIG ?? {};
    const extras = configs.extras ?? {};
    const params = configs.params ?? [];

    // Extract the page name from the file path
    const parts = path.split('/');
    const pageName = parts.pop().replace(/\.\w+$/, '').toLowerCase();
    const pageUrl = `${NAME}/${[...parts.slice(3), pageName].join('/')}`;
    const pageRoute = configs.route ?? `${pageUrl}${params.length > 0 ? `/:${params.join('/:')}` : ''}`



    pagesMap[pageUrl] = {
      path: pageRoute,
      component: mod.default,
      extras
    };
  }
  return pagesMap;
}

function mapLayouts() {
  const layouts = import.meta.globEager('./src/layouts/**/*.vue');

  const layoutsMap = {};
  for (const path in layouts) {
    const mod = layouts[path];
    // Extract the layout name from the file path
    const layoutName = path.split('/').pop().replace(/\.\w+$/, '');
    layoutsMap[layoutName] = mod.default;
  }
  return layoutsMap;
}

export default {
  ENDPOINTS,
  SERVICES: mapServices(),
  COMPONENTS: mapComponents(),
  PAGES: mapPages(),
  LAYOUTS: mapLayouts(),
}
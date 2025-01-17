import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  getPackageManager,
  getPackageManagerText,
} from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
} from '@modern-js/generator-common';
import { localeKeys, i18n } from './locale';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.BYTED_CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const handleTemplateFile = async (
  context: GeneratorContext,
  appApi: AppAPI,
  _generator: GeneratorCore,
) => {
  await appApi.forgeTemplate('templates/docs/**/*', undefined, resourceKey =>
    resourceKey.replace('templates/', '').replace('.handlebars', ''),
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/module-doc-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, appApi, generator);

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag),
    undefined,
    context.config,
  );

  const appDir = context.materials.default.basePath;
  const packageManager =
    context.config.packageManager || (await getPackageManager(appDir));

  appApi.showSuccessInfo(
    i18n.t(localeKeys.success, {
      packageManager: getPackageManagerText(packageManager),
    }),
  );

  generator.logger.debug(`forge @modern-js/module-doc-generator succeed `);
};

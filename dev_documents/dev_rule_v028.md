开发规则：
0.确保遇到任何问题时，请仔细阅读报错信息，详细分析，都进行逐步思考，输出思考过程和每一步的思考步骤，找出问题所在，定位错误根源，有针对性的修复问题
  0.0.1 所有开发设计的代码行数，尽量控制在 500 行以内，使用最简洁、最可靠的方式实现代码逻辑
  0.0.2 所有UI 界面风格如果可以，使用统一的独立配置文件，不要每一个文件写一个方法，尽量做到统一调用，除非特殊组件需求。
  0.1，逐行逐字逐句的阅读报错信息
  0.2，逐行思考和逐步思考，输出思考步骤
  0.3，根据思考步骤，找出问题所在
  0.4，定位问题，有针对性的修复问题，
  0.5，自我验证逻辑自洽性
  0.6，提交修改建议
  0.7，反思自己的过错，避免重复犯错。
1.所有的关键信息key配置都需要存储在 .env/生产环境使用.env.prod/测试环境使用.env.dev 文件中，统一管理
2.在添加任何方法之后，都需要对函数进行定义和声明
3.使用最小化代码模块的方式开发，严格遵守，已经测试通过的代码功能，不做修改和调整，除非有特殊需求
4.遇到问题，打印更多的debug log来定位，不要盲目修改
6.开发所有新功能时，都不能影响现有功能的正常逻辑
7.不能随便删除原有正常功能的代码逻辑，除非涉及到现有新加功能的关联性的必要改动
8.开发过程中，需要及时提交代码，并及时更新版本号
9.开发过程中，需要及时更新commit，并及时推送到远程仓库
10.开发过程中，需要及时更新package.json中的版本号，并及时推送到远程仓库
11.开发过程中，需要及时更新dev_rule.txt中的开发规则，并及时推送到远程仓库
12.开发过程中，需要及时更新README.md中的开发文档，并及时推送到远程仓库
13.不要随意删除任何文件，除非确定该文件不再需要
14.不要随意删除任何文件夹，除非确定该文件夹不再需要
15.不要随意删除项目中的任何key值和配置，除非确定该key值和配置不再需要
16.不要随意删除项目中的任何代码注释消息，除非确定该key值和配置不再需要
17.请使用**Material Design** 和 **Human Interface Guidelines** （HIG），
优化ui迭代方案，基于@dev_rule的规则为最基础前提，对 @codebase 里面的 文件 进行迭代优化，
注意：在优化ui过程中，不要删除任何逻辑代码块和key值和配置，以及代码中已经包含的组件和注释说明，只需要优化迭代ui显示层面的代码，
务必牢记 并遵循 @dev_rule.txt , 对 @codebase 进行每一个模块的ui界面优化，在优化
完成后，帮我列出已优化和待优化的文件列表，谢谢
18. 请不要将任何key暴露在代码中，都需要使用调用env文件中的key作为标准
19. 针对发生的问题进行有针对性的处理，最高优先级处理现下出现的错误，
20. 请在修改时，严格遵守 @dev_rule.txt 的标准，进行修改，然后思考修改的内容是否违背开发原则，最终输出正确的修改，
21. 如果支持多语言模式，请务必使用多语言对应键值调用，而避免使用 hardcode 代码来显示多语言文本
22. 在创建任何文件之前，通读项目中全部代码，确保没有任何一个文件和当前所需要创建的文件是重复功能的，才可以创建新文件
23. 在开发过程中，请使用 run-commit.bat 脚本来自动提交和推送代码，以确保代码的及时提交和推送
24. 导入的第三方库，请使用npm install 安装，并确保安装的库是项目所需要的，避免安装不必要的库
25. 在开发过程中，请使用i18next 多语言管理库，来管理多语言文本，避免使用 hardcode 文本
26. 在开发过程中，请使用react-i18next 库，来管理多语言文本，避免使用 hardcode 文本
27. 在开发过程中，请使用react-router-dom 库，来管理路由跳转，避免使用 hardcode 文本
28. 在开发过程中，请使用react-hook-form 库，来管理表单，避免使用 hardcode 文本
29. 在开发过程中，请使用axios 库，来管理网络请求，避免使用 hardcode 文本
30. 在开发过程中，请使用react-query 库，来管理数据请求，避免使用 hardcode 文本
31. 在开发过程中，请使用react-hook-form 库，来管理表单，避免使用 hardcode 文本
32. 在开发过程中，请使用react-hook-form 库，来管理表单，避免使用 hardcode 文本
33. 在新添加任何文件之后，请在README.md中列出该文件的详细说明，包括该文件的功能，使用的技术，以及该文件的详细说明
34. 在新添加任何功能之后，到需要在所有相关文件的导入路径中，检查是否正确，避免出现路径错误
35. 随时注意代码中显示的中文乱码问题，以及导出csv文件中出现乱码问题等，需要随时注意编码格式
36. 如果存在健康检查的代码，解决健康检查过于严格导致的部署问题，同时保持基本的服务可用性检查。
37. 项目内调用多语言时，请使用 import { useLanguage } from '../contexts/LanguageContext'; 来调用多语言，避免使用 import { useTranslation } from 'react-i18next'; 来调用多语言
38. 在生成随机颜色时，应遵循以下原则：
    a. 使用 HSL 或 RGB 色彩空间进行真随机颜色生成，避免使用预定义的颜色列表
    b. 实现颜色对比度检查函数，确保生成的颜色与背景色有足够的对比度
    c. 考虑亮度和饱和度范围，确保颜色的可读性
    d. 对于重要的UI元素，需要确保颜色的可访问性(WCAG标准)
    e. 在深色/浅色主题切换时，动态调整颜色生成的参数范围
    f. 确保每一行免责声明的文字颜色和背景色有足够对比度（WCAG AA 标准，推荐对比度 > 4.5:1）。
    g. 对比度检测：用 luminance 算法，确保生成的颜色与背景色对比度大于 4.5。
    h. 使用以下推荐的颜色生成方法：
      h1  适当考虑添加对比度检测函数
      h2. 生成合格的随机颜色
      h3. 在 JSX 中使用
  参考代码：

  // 计算对比度
  function contrastRatio(l1: number, l2: number) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // HSL 转 RGB
  function hslToRgb(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }

  function generateAccessibleRandomColor(key: string, backgroundColor = '#181A20') {
    // 解析背景色
    const bg = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(backgroundColor);
    const bgRgb = bg
      ? [parseInt(bg[1], 16), parseInt(bg[2], 16), parseInt(bg[3], 16)]
      : [24, 26, 32]; // 默认深色

    const bgLum = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

    let color, rgb, lum, ratio;
    let tries = 0;
    do {
      // 用 key 做种子，保证每次渲染一致
      const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const hue = (Math.floor(Math.random() * 360) + hash * 13) % 360;
      const saturation = 70 + (hash % 20); // 70-90%
      const lightness = 55 + (hash % 20); // 55-75%，比原来更亮
      color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      rgb = hslToRgb(hue, saturation, lightness);
      lum = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
      ratio = contrastRatio(lum, bgLum);
      tries++;
      // 最多尝试10次，防止死循环
    } while (ratio < 4.5 && tries < 10);

    return color;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <OnlineStats className="mb-6" />
        <h2 className="text-2xl font-bold text-center mb-8">
          {t('common.selectCharacter')}
        </h2>
        <MarqueeNotice messages={marqueeMessages} />

        <div className="text-center text-xs md:text-sm mb-6" style={{ letterSpacing: 0.5 }}>
          <span
            style={{ color: generateAccessibleRandomColor('disclaimer1'), display: 'block', marginBottom: 2 }}
          >
            {t('disclaimers.noSensitiveUse')}
          </span>
          <span
            style={{ color: generateAccessibleRandomColor('disclaimer2'), display: 'block' }}
          >
            {t('disclaimers.nonMedicalAdvice')}
          </span>
        </div>

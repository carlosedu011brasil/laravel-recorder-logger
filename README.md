# Laravel Recorder Logger

Componente Vue para gravação de tela com logging embutido. Instalável via Composer e integrável com aplicações Laravel utilizando Inertia.js ou SPA com Vue 3.

## Instalação

1. Requisite o pacote via Composer:

```bash
composer require carlosedu011brasil/laravel-recorder-logger
```

2. Publique os arquivos do componente:

```bash
php artisan vendor:publish --tag=recorder-components
```

## Estrutura do Projeto

O pacote disponibiliza:

- `resources/js/Components/Recorder.vue`: componente Vue completo
- `src/RecorderLoggerServiceProvider.php`: Service Provider responsável pela publicação dos assets
- `composer.json`: metadata e autoload do pacote

## Importação

Após a publicação dos arquivos, importe e utilize o componente diretamente em seu projeto Vue 3:

```js
import Recorder from '@/Components/Recorder.vue'
```

```vue
<template>
  <Recorder theme="primary" />
</template>
```

## Funcionalidade

Este componente oferece uma solução completa para capturar sessões do usuário, incluindo gravação de tela e coleta de logs técnicos, com objetivo de auxiliar em processos de suporte, QA ou análise de erros em produção.

### Gravação de Tela

- Utiliza `navigator.mediaDevices.getDisplayMedia()` para capturar vídeo e áudio da aba, janela ou tela.
- Controlado por `MediaRecorder`, com suporte a pausa, retomada e parada da gravação.
- Timer visível durante a gravação.
- Ao finalizar, o vídeo é convertido para `Blob` e disponibilizado via URL para visualização prévia.

### Logger embutido

Durante a gravação, os seguintes eventos são interceptados e armazenados em um objeto logger:

#### Troca de Rotas

- Acompanha alterações de rota utilizando `history.pushState`, `history.replaceState` e `popstate`.
- Cada mudança de rota é registrada com timestamp e URL.

#### Requisições HTTP

Interceptação de requisições via:

- `fetch()`
- `XMLHttpRequest`

Cada requisição registrada inclui tipo, método, URL, status e data/hora.

#### Logs do Console

Interceptação dos seguintes métodos:

- `console.log`
- `console.warn`
- `console.error`
- `console.info`

Cada log inclui tipo, argumentos passados e horário.

#### Erros Globais

Captura de erros não tratados:

- `window.onerror`
- `window.onunhandledrejection`

Todos os erros são armazenados com mensagem, linha, coluna e arquivo de origem.

### Estrutura do Output

Ao finalizar a gravação, o componente gera um objeto com a seguinte estrutura:

```json
{
  "descricao": "Texto digitado pelo usuário no textarea",
  "videoUrl": "blob:<url-do-vídeo>",
  "logs": {
    "StartpageUrl": "URL inicial da gravação",
    "visitedRoutes": [...],
    "console": [...],
    "errors": [...],
    "requests": [...]
  }
}
```

Este objeto é exibido no console para exportação manual ou uso posterior.

## Estilização

O componente utiliza SCSS encapsulado com tema escuro por padrão. Botões possuem estados distintos para iniciar, pausar, continuar e parar a gravação. Pode ser personalizado conforme o tema do projeto principal.

## Dependências

- Vue 3 (Composition API)
- Suporte a browsers modernos que implementem `MediaRecorder` e `getDisplayMedia`

## Considerações

Este componente é indicado para uso em ambientes de desenvolvimento, homologação ou produção com consentimento explícito do usuário, devido à natureza da gravação de tela e coleta de dados.

## Licença

Este projeto está licenciado sob a licença MIT.

# OpenTask

Gerenciador de tarefas (to-do) simples, feito com HTML, CSS e JavaScript puro. Não precisa de servidor, de conta nem de instalação: tudo fica salvo no seu navegador.

**Demo:** https://grownvie.github.io/opentask/

## Sobre o projeto

O OpenTask nasceu no Glitch como um estudo de JavaScript e de armazenamento de dados no navegador. Também foi um teste da capacidade de codificação de uma inteligência artificial: o HTML e o CSS foram gerados por prompts no DeepSeek, que também otimizou e escreveu partes do JavaScript. O código foi revisado e corrigido depois disso.

## Funcionalidades

- Adicionar tarefas com título, detalhes (opcional), data e categoria
- Editar e excluir tarefas
- Marcar tarefas como concluídas
- Filtrar por **Todas**, **Pendentes** ou **Concluídas**
- Buscar por título, detalhes ou categoria
- Criar e apagar categorias (as tarefas da categoria apagada ficam "Sem categoria")
- Limpar todas as tarefas concluídas de uma vez
- Sincronização entre abas abertas do mesmo navegador
- Interface escura e responsiva, com suporte a teclado e a leitores de tela

## Como usar

### Online

Acesse a demo pelo link acima.

### Localmente

Baixe ou clone o repositório e abra o `index.html` no navegador:

```bash
git clone https://github.com/grownvie/opentask.git
cd opentask
```

Se preferir servir por HTTP (opcional):

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

> Os ícones (Lucide) e as fontes (Google Fonts) são carregados da internet. Sem conexão o app continua funcionando, mas sem ícones e com fontes do sistema.

## Atalhos de teclado

| Onde | Tecla | Ação |
| --- | --- | --- |
| Campo de título | `Enter` | Adiciona a tarefa |
| Modal de edição | `Enter` no título | Salva a edição |
| Modal de edição | `Esc` | Fecha o modal (pede confirmação se houver alterações) |
| Dropdown de categoria | `↓` / `↑` | Abre e navega pelas opções |
| Dropdown de categoria | `Home` / `End` | Vai para a primeira / última opção |
| Dropdown de categoria | `Enter` / `Espaço` | Escolhe a opção em foco |
| Dropdown de categoria | `Delete` | Apaga a categoria em foco |
| Dropdown de categoria | `Esc` | Fecha o dropdown |

## Onde os dados ficam

Os dados são salvos no `localStorage` do navegador, em duas chaves:

| Chave | Conteúdo |
| --- | --- |
| `opentask_tasks` | Lista de tarefas |
| `opentask_categories` | Lista de categorias |

Formato de uma tarefa:

```json
{
  "id": "1760000000000123",
  "title": "Estudar JavaScript",
  "description": "Revisar eventos e armazenamento",
  "date": "2026-10-20",
  "category": "Estudos",
  "completed": false
}
```

Algumas consequências disso:

- Os dados pertencem a **um navegador em um dispositivo**. Não há sincronização entre aparelhos.
- Limpar os dados do site no navegador apaga as tarefas.
- Se os dados salvos estiverem corrompidos, o app abre vazio em vez de quebrar.
- Para fazer backup, copie os valores das duas chaves em *Ferramentas do desenvolvedor → Application → Local Storage*.

## Estrutura do projeto

```
opentask/
├── index.html   # Estrutura da página
├── style.css    # Estilos e layout responsivo
├── script.js    # Lógica: tarefas, categorias, dropdown, armazenamento
├── favicon.png
└── favicon.ico
```

## Tecnologias

- HTML, CSS e JavaScript (sem frameworks e sem etapa de build)
- [Lucide](https://lucide.dev) para os ícones
- Google Fonts: Onest, Inter e Instrument Serif

## Contribuindo

Sugestões e correções são bem-vindas. Abra uma [issue](https://github.com/grownvie/opentask/issues) descrevendo o problema ou a ideia, ou envie um pull request.

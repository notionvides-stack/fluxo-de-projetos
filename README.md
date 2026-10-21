# Fluxo de Projetos

Crie um aplicativo web full-stack chamado "Gerenciador de Projeto", em português do Brasil, para gestão de demandas semanais de uma equipe de 6 a 15 pessoas e acompanhamento de desenvolvimento de produtos/coleções. O produto deve ter visual profissional inspirado na usabilidade do Monday.com (não copie logotipo nem identidade proprietária): navegação lateral, tabelas de gestão, status coloridos, avatares circulares dos colaboradores, indicadores e barras de progresso.

REQUISITOS VISUAIS:
- Desktop-first, responsivo, aparência limpa e corporativa.
- Sidebar: Visão geral, Demandas, Acompanhamento de coleção, Equipe, Relatórios, Histórico e Configurações.
- Topbar com busca, seletor de semana (segunda a sexta), notificações e avatar do usuário.
- Cores suaves, azul como cor de ação, status distinguíveis, tabelas com linhas organizadas, cabeçalhos fixos quando possível.
- Usar avatares/fotos circulares junto ao nome de cada responsável; se não houver foto, iniciais em círculo. Não inventar fotos de funcionários reais.

FUNCIONALIDADES:
1. Autenticação: login, logout e recuperação de senha, usando backend Lovable/Supabase quando disponível. Perfil com nome, e-mail, foto/avatar e função. Funções: administrador e colaborador.
2. Permissões: administrador vê e gerencia tudo, cria demandas e atribui responsáveis, gerencia equipe, edita prazos/prioridades, fecha semanas e acessa relatórios globais. Colaborador vê suas próprias demandas e pode atualizar progresso manual (0–100), status e observações das próprias demandas. Proteger ações no backend/banco, não só esconder botões.
3. Visão geral: cards com total de demandas, concluídas, em andamento, atrasadas e percentual médio; lista/tabela com tarefa, responsável com avatar, prioridade, status, prazo e barra/percentual de progresso. Filtrar por semana, responsável, status e prioridade.
4. Demandas: CRUD completo de tarefas com título, descrição, responsável, prioridade, status, progresso manual 0–100, data de início, prazo, semana/período e comentários/observações. Status sugeridos: Não iniciado, Em andamento, Aguardando, Bloqueado, Concluído. Permitir busca e filtros. Validação de progresso e datas.
5. Acompanhamento de coleção: tabela editável de produtos com marca/coleção, designer, licenciadora, data de envio, referência, produto, imagens do desenvolvimento, status, fornecedor, primeiro envio, deadline, etiqueta interna de produto oficial, primeira piloto, Remarks 1/2/3, piloto final, status final e observações. Permitir múltiplas imagens por produto com armazenamento persistente, visualização em miniatura e upload. Status finais: Pendente, Aprovado, Reprovado, Ajustes solicitados. Filtros por marca, designer, fornecedor, status e prazo.
6. Fechamento semanal: semana de segunda a sexta-feira. Tela de revisão para administrador, com resumo geral e por colaborador. Ao fechar, criar snapshot imutável dos dados e métricas daquela semana para que mudanças posteriores não alterem o histórico. Permitir reabrir apenas para administrador, registrando auditoria. Mostrar tarefas concluídas, em andamento, bloqueadas, atrasadas e progresso médio por pessoa.
7. Relatórios PDF: gerar relatório semanal com nome do sistema, período, data de geração, métricas, progresso por colaborador (com avatar/nome), tabela de demandas e status, pendências/atrasos e observações. Implementar botão real de gerar/baixar PDF usando biblioteca compatível com a aplicação (por exemplo jsPDF ou impressão de layout dedicado), não apenas um botão decorativo. Também permitir relatório de acompanhamento de coleção.
8. Histórico/auditoria: registrar alterações relevantes de tarefa, progresso, status, responsável, datas e fechamento, com autor, data/hora e valores anterior/novo. Preservar snapshots de semanas fechadas.
9. Dados iniciais demonstrativos claramente identificados como exemplos. Não mostrar métricas falsas como se fossem reais; quando houver dados de demonstração, sinalizar "Dados de exemplo".

IMPLEMENTAÇÃO:
- Use TypeScript, React, Tailwind e shadcn/ui seguindo a stack padrão Lovable.
- Use Supabase para autenticação, PostgreSQL e Storage se a integração estiver disponível. Crie migrations/schema para profiles, tasks, weekly_periods, task_updates/audit_log, weekly_reports/snapshots, collection_products e collection_product_images. Relacionamentos e índices apropriados.
- Ativar Row Level Security nas tabelas e definir políticas seguras: admin full access; colaborador acessa somente suas próprias demandas e pode atualizar apenas os campos permitidos; coleção com leitura da equipe e edição conforme papel (colaborador pode cadastrar/editar seus desenvolvimentos; admin tudo). Nunca expor service role key no cliente.
- Se credenciais/integração ainda não estiverem conectadas, construir a UI completa e preparar a estrutura para conectar, deixando claro quais passos de configuração faltam; não fingir que autenticação, upload ou persistência estão funcionando sem backend.
- Criar componentes reutilizáveis, estados de carregamento/erro/vazio, validação de formulários, confirmação antes de excluir/fechar semana e acessibilidade.
- Gerar um README com instruções para configurar backend, variáveis de ambiente, migrações, criar o primeiro administrador e testar permissões.
- Não publicar automaticamente. Primeiro entregar um protótipo funcional no editor/preview.
Comece implementando as páginas principais com navegação funcional, visão geral e tabela de demandas, e depois a aba de acompanhamento de coleção.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fe837a04-b877-4efc-ac6b-0d7a8db11b27).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

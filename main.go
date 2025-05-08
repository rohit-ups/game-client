package main

import (
	"os"
	"tui-client/ui"

	tea "github.com/charmbracelet/bubbletea"
)

type model struct {
	current tea.Model
}

func main() {
	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		os.Exit(1)
	}
}

func initialModel() model {
	return model{
		current: ui.InitialLogin(),
	}
}

func (m model) Init() tea.Cmd {
	return m.current.Init()
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC:
			return m, tea.Quit
		}
	}

	// Delegate to current sub-model
	newModel, cmd := m.current.Update(msg)
	m.current = newModel
	return m, cmd
}

func (m model) View() string {
	return m.current.View()
}

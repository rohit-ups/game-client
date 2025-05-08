package ui

import (
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	focusedStyle = lipgloss.NewStyle().
			BorderStyle(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("62")).
			Padding(1)

	blurredStyle = lipgloss.NewStyle().
			BorderStyle(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("240")).
			Padding(1)

	titleStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("62")).
			Bold(true).
			MarginBottom(1).
			Align(lipgloss.Center)
)

type LoginModel struct {
	username   textinput.Model
	password   textinput.Model
	focusIndex int
}

func InitialLogin() *LoginModel {
	username := textinput.New()
	username.Placeholder = "Username"
	username.Focus()
	username.CharLimit = 32
	username.Width = 20

	password := textinput.New()
	password.Placeholder = "Password"
	password.CharLimit = 32
	password.Width = 20
	password.EchoMode = textinput.EchoPassword

	return &LoginModel{
		username:   username,
		password:   password,
		focusIndex: 0,
	}
}

func (m *LoginModel) Init() tea.Cmd {
	return textinput.Blink
}

func (m *LoginModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			return m, tea.Quit
		case "tab", "shift+tab", "enter", "up", "down":
			s := msg.String()

			if s == "enter" && m.username.Value() != "" && m.password.Value() != "" {
				// TODO: Handle login
				return m, nil
			}

			if s == "up" || s == "shift+tab" {
				m.focusIndex--
			} else {
				m.focusIndex++
			}

			if m.focusIndex > 1 {
				m.focusIndex = 0
			} else if m.focusIndex < 0 {
				m.focusIndex = 1
			}

			cmds := make([]tea.Cmd, 2)
			if m.focusIndex == 0 {
				cmds[0] = m.username.Focus()
				m.password.Blur()
			} else {
				m.username.Blur()
				cmds[1] = m.password.Focus()
			}

			return m, tea.Batch(cmds...)
		}
	}

	// Handle character input
	m.username, cmd = m.username.Update(msg)
	return m, cmd
}

func (m *LoginModel) View() string {
	var b strings.Builder

	b.WriteString(titleStyle.Render("Game Client Login"))
	b.WriteString("\n\n")

	inputs := []string{
		focusedStyle.Render(m.username.View()),
		blurredStyle.Render(m.password.View()),
	}

	if m.focusIndex == 1 {
		inputs[0] = blurredStyle.Render(m.username.View())
		inputs[1] = focusedStyle.Render(m.password.View())
	}

	b.WriteString(strings.Join(inputs, "\n"))
	b.WriteString("\n\n")
	b.WriteString("(Press tab to switch fields, enter to submit)\n")

	return b.String()
}

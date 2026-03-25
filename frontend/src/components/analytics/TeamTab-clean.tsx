import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Star, Trophy, Target } from "lucide-react";

export default function TeamTab() {
    // Mock team data for demonstration
    const teamMembers = [
        { id: 1, name: "John Doe", email: "john@example.com", tasksCompleted: 15, totalTasks: 18, completionRate: 83 },
        { id: 2, name: "Jane Smith", email: "jane@example.com", tasksCompleted: 12, totalTasks: 14, completionRate: 86 },
        { id: 3, name: "Bob Johnson", email: "bob@example.com", tasksCompleted: 8, totalTasks: 12, completionRate: 67 },
    ];

    const totalTeamTasks = teamMembers.reduce((sum, member) => sum + member.totalTasks, 0);
    const totalCompletedTasks = teamMembers.reduce((sum, member) => sum + member.tasksCompleted, 0);
    const teamCompletionRate = Math.round((totalCompletedTasks / totalTeamTasks) * 100);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Team Overview */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {teamMembers.length}
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                        Active team members
                    </p>
                </CardContent>
            </Card>

            {/* Team Performance */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
                    <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {teamCompletionRate}%
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                        Average completion rate
                    </p>
                </CardContent>
            </Card>

            {/* Top Performer */}
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                                {teamMembers[0]?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{teamMembers[0]?.name}</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                        {teamMembers[0]?.completionRate}% completion rate
                    </p>
                </CardContent>
            </Card>

            {/* Team Performance List */}
            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Team Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {teamMembers.map((member, index) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-bold text-gray-500 w-6">#{index + 1}</span>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-gray-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{member.tasksCompleted}/{member.totalTasks}</p>
                                        <p className="text-xs text-gray-500">tasks completed</p>
                                    </div>
                                    <Badge variant={member.completionRate >= 80 ? "default" : member.completionRate >= 60 ? "secondary" : "destructive"}>
                                        {member.completionRate}%
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

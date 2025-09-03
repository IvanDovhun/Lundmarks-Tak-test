import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, RotateCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Project, type Calculation, ProjectWithTeam } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProjectIcon, HomeIcon, ReuseIcon } from '../icons/svg';
import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import GantTimeline from '@/components/ui/gant';
import { DateRangeInput } from "@/components/ui/daterangeinput";
import Navbar from "@/components/ui/navbar";

interface CardData {
  id: number;
  address: string;      // ex. "Lagergatan 23"
  customer: string;     // ex. "Per Andersson"
  project: string;      // ex. "P1004"
  teamName: string | null;     // ex. "Isak + Billy"
  teamColor: string | null;
  startDate: string | null;    // ex. "2025-02-02"
  endDate: string | null;      // ex. "2025-02-09"
}

export default function MontagePage() {

  // API-data
  const { data: projects } = useQuery<ProjectWithTeam[]>({
    queryKey: ["/api/montage/projects"],
  });
  const [cards, setCards] = useState<CardData[]>([]);
  const [, navigate] = useLocation();

  // Popup för att skapa team
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#ff0000");
  const [projectIdForTeamCreation, setProjectIdForTeamCreation] = useState<number | null>(null);

  // Hämta data när komponenten mountar
  useEffect(() => {
    if (projects) {
      const cardData: CardData[] = projects.map((project) => {
        return {
          id: project.id,
          address: project.address,
          customer: project.kundFirstName + " " + project.kundLastName,
          project: project.kundnummer,
          teamName: project.teamName,
          teamColor: project.teamColor,
          startDate: project.startDatum,
          endDate: project.slutDatum,
        }
      })

      setCards(cardData);
    }
    
  }, [projects]);

  // Klick på kort
  function handleCardClick(cardId: number) {
    console.log("Kort klickat:", cardId);
    // Lägg till valfri logik (öppna detaljvy, etc.)
  }

  // Öppna popup för nytt team
  function handleAddTeam() {
    setProjectIdForTeamCreation(projectId);
    console.log("Add team");
    setShowTeamPopup(true);
  }

  async function handleDatesChange(
    cardId: number,
    newDates: { startDate: string | null; endDate: string | null }
  ) {
    
    await apiRequest(
      "PATCH",
      `/api/montage/projects/${cardId}/change-type`,
      { startDatum: newDates.startDate,
        slutDatum: newDates.endDate },
    );
    queryClient.invalidateQueries({ queryKey: ["/api/montage/projects"] });

    setCards(prevCards =>
      prevCards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            startDate: newDates.startDate,
            endDate: newDates.endDate,
          };
        }
        return card;
      })
    );
    
    console.log(`Dates updated for card ${cardId}:`, newDates);
  }

  // Spara nytt team
  async function handleCreateTeam(projectId: number, teamName: string, teamColor: string) {

    await apiRequest(
      "PATCH",
      `/api/montage/teams/new`,
      { projectId,
        teamName,
        teamColor },
    );
    queryClient.invalidateQueries({ queryKey: ["/api/montage/projects"] });

    setCards(prevCards =>
      prevCards.map(card => {
        if (card.id === projectId) {
          return {
            ...card,
            teamName: teamName,
            teamColor: teamColor,
          };
        }
        return card;
      })
    );

    setNewTeamName("");
    setNewTeamColor("#ff0000");
    setShowTeamPopup(false);
  }

  return (
    <div className="min-h-screen">
      <header className="title-area">
        <Navbar/>
      </header>

      <main className="montage-base pt-16">
        <div className="flex flex-row">
          <div className="flex flex-col w-2/5">
            <div className="flex flex-wrap justify-between mb-4 gap-y-3 gap-x-1">
              <button className="button !px-4">
                <span className="button-text">Väntar</span>
              </button>
              <button className="button !px-4">
                <span className="button-text">Pågående</span>
              </button>
              <button className="button !px-4">
                <span className="button-text">Avslutade</span>
              </button>
            </div>
            <div className="overflow-y-scroll space-y-4">
              {cards?.map((deal) => (
                <Card key={deal.id} className={`crm-card`}>
                  <div className="flex flex-row items-center text-center gap-4 inline-block px-4 py-2 bg-gray-200 crm-card-header">
                    <p className="crm-card-title !font-bold">{deal.address}</p>
                  </div>
                  <CardContent className="px-4 py-0">
                    <Table className="">
                      <TableBody>
                        <TableRow className="crm-card-row">
                          <TableCell className="crm-head">Kund:</TableCell>
                          <TableCell className="crm-item">{deal.customer}</TableCell>
                        </TableRow>
                        <TableRow className="crm-card-row">
                          <TableCell className="crm-head">Projekt:</TableCell>
                          <TableCell className="crm-item">{deal.project}</TableCell>
                        </TableRow>
                        <TableRow className="crm-card-row">
                          <TableCell className="crm-head">Team:</TableCell>
                          {deal.teamName ? (
                            <TableCell className="crm-item">
                              <div className="flex items-center"> {/* Flex container */}
                                <span style={{ color: deal.teamColor ?? 'inherit' }}> {/* Apply color to text */}
                                  {deal.teamName}
                                </span>
                                {deal.teamColor && (
                                  <span
                                    className="inline-block w-3 h-3 rounded-full ml-2" // ml-2 adds space (like 0.5rem if base font is 16px)
                                    style={{ backgroundColor: deal.teamColor, marginLeft: '0.5rem' }} // Ensure spacing
                                  ></span>
                                )}
                              </div>
                            </TableCell>
                          ) : (
                            <TableCell
                              className="montage-create-team crm-item !text-blue-600 hover:!text-blue-800 cursor-pointer"
                              onClick={() => handleAddTeam(deal.id)}
                            >
                              Tilldela team
                            </TableCell>
                          )}
                        </TableRow>
                        <TableRow className="crm-card-row">
                          <TableCell className="crm-head">Tidsplan:</TableCell>
                          <TableCell className="crm-item"><DateRangeInput
                            label="" // Label provided by TableCell, hide internal label
                            hideLabel={true} // Add prop to DateRangeInput to hide its internal label if needed
                            startDate={deal.startDate}
                            endDate={deal.endDate}
                            // Pass a function that calls handleDatesChange with the specific deal.id
                            onDatesChange={(newDates) => handleDatesChange(deal.id, newDates)}
                            className="" // Ensure it takes appropriate width within the cell
                          /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex flex-col w-3/5 ps-4">
            {/* Höger: Gantt-schema */}
            <GantTimeline 
              cards={cards}                // Pass the task data
            />
          </div>
        </div>
      </main>
    </div>
  );
}